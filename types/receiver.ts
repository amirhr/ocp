/**
 * OCP receiver-side helpers.
 *
 * Pure functions for the destination side of the protocol. Implements the
 * full verification flow described in SPEC.md § Verification flow:
 *   1. Schema validation
 *   2. Timestamp check
 *   3. Sender authentication (DKIM-equivalent)
 *   4. Advertiser authorization (SPF-equivalent, optional)
 *   5. Receiver policy (DMARC-equivalent)
 *   6. Idempotency
 *
 * I/O dependencies (well-known file fetching, dedup-store lookup, signature
 * verification) are abstracted via injectable functions so the same helpers
 * work in any runtime.
 */

import type { EcapiEventType } from './ecapi';
import type {
  OcpEvent,
  OcpRejectionReason,
  OcpVerificationResult,
  OcpWellKnown,
  OcpReceiverBlock,
} from './ocp';
import { base64urlDecode, utf8Decode } from './sender';

// ---------------------------------------------------------------------------
// Injectable dependencies
// ---------------------------------------------------------------------------

/**
 * Fetch a well-known file. Implementations should HTTPS-GET
 * `https://{domain}/.well-known/ocp.json` with caching, returning null on
 * 404 or unreachable. Cache TTL of 1 hour is recommended.
 */
export type OcpWellKnownFetcher = (domain: string) => Promise<OcpWellKnown | null>;

/**
 * Verify a signature given the raw body bytes, the base64url signature,
 * and the public key entry from the sender's well-known file. Implementers
 * use Web Crypto, libsodium, or whatever signing library suits their runtime.
 */
export type OcpSignatureVerifier = (
  bodyBytes: Uint8Array,
  signature: string,
  key: { kid: string; alg: string; pub: string },
) => Promise<boolean>;

/**
 * Idempotency check. Returns true if the dedup key has been seen before.
 * Implementations typically use Redis, a database, or a bloom filter.
 */
export type OcpDedupCheck = (dedupKey: string) => Promise<boolean>;

/**
 * Inputs to {@link verifyInboundRequest}.
 */
export interface OcpVerifyInput {
  /** Raw request body bytes (signed; do not re-serialize). */
  bodyBytes: Uint8Array;
  /** HTTP request headers. Header name lookup is case-insensitive. */
  headers: Record<string, string>;
  /** Receiver's own configuration block. */
  receiverConfig: OcpReceiverBlock;
  /** Current unix timestamp in seconds (injectable for testing). */
  now: number;
  /** Fetcher for sender / advertiser well-known files. */
  fetchWellKnown: OcpWellKnownFetcher;
  /** Signature verifier. */
  verifySignature: OcpSignatureVerifier;
  /** Optional dedup check. If omitted, idempotency is skipped (the receiver's pipeline must dedupe). */
  isDuplicate?: OcpDedupCheck;
}

// ---------------------------------------------------------------------------
// Top-level verification
// ---------------------------------------------------------------------------

/**
 * Verify an inbound OCP conversion request end-to-end.
 *
 * Returns a discriminated union: on success, `{ accepted: true, ... }` with
 * the parsed event and resolved sender/advertiser identities; on failure,
 * `{ accepted: false, reason, http_status }` suitable for direct response.
 */
export async function verifyInboundRequest(
  input: OcpVerifyInput,
): Promise<OcpVerificationResult> {
  // 1. Schema validation
  const parsed = parseAndValidateBody(input.bodyBytes, input.receiverConfig);
  if (!parsed.ok) return reject(parsed.reason, 400, parsed.detail);
  const event = parsed.event;

  const provider = headerLookup(input.headers, 'OCP-Provider');
  const keyId = headerLookup(input.headers, 'OCP-Key-Id');
  const signature = headerLookup(input.headers, 'OCP-Signature');

  // 2. Timestamp
  const skewLimit = input.receiverConfig.max_timestamp_skew_seconds ?? 300;
  if (Math.abs(input.now - event.timestamp) > skewLimit) {
    return reject('timestamp_out_of_window', 401);
  }

  // 3. Sender authentication
  const authMode = input.receiverConfig.auth_required ?? 'signed';
  const isSigned = !!provider && !!keyId && !!signature;

  if (authMode === 'signed' && !isSigned) {
    return reject('unsigned_not_allowed', 401);
  }

  if (isSigned) {
    const senderProfile = await input.fetchWellKnown(provider!);
    if (!senderProfile?.sender?.keys?.length) {
      return reject('sender_well_known_unavailable', 401);
    }
    const key = senderProfile.sender.keys.find(k => k.kid === keyId);
    if (!key) return reject('unknown_key_id', 401);
    const sigValid = await input.verifySignature(input.bodyBytes, signature!, key);
    if (!sigValid) return reject('invalid_signature', 401);
  }

  // 4. Advertiser authorization (SPF)
  const advertiserDomain = event.advertiser.domain;
  const isFirstParty = !!provider && provider === advertiserDomain;

  if (input.receiverConfig.verify_advertiser_authorization && isSigned && !isFirstParty) {
    // First-party senders are implicitly authorized — they signed with keys
    // published at their own domain, which is sufficient. Only third-party
    // senders need the SPF check.
    const advertiserProfile = await input.fetchWellKnown(advertiserDomain);
    if (!advertiserProfile?.sender) {
      return reject('advertiser_well_known_unavailable', 401);
    }
    const authorized =
      (advertiserProfile.sender.authorized_providers ?? []).includes(provider!);
    if (!authorized) return reject('sender_not_authorized_by_advertiser', 401);
  }

  // 5. Receiver policy (DMARC)
  if (isSigned && !isFirstParty) {
    // First-party always accepts; only third-party senders need to clear
    // the allowlist gate.
    const allowlist = input.receiverConfig.authorized_providers ?? [];
    const openMode = allowlist.length === 0;
    if (!openMode && !allowlist.includes(provider!)) {
      return reject('sender_not_authorized_by_receiver', 401);
    }
  }

  // 6. Idempotency
  if (input.isDuplicate) {
    const dedupKey = computeDedupKey(event);
    if (await input.isDuplicate(dedupKey)) {
      // Treat duplicates as success (idempotent). Caller may still want to
      // distinguish via accepted=true plus a flag, but spec semantics say 200.
      return {
        accepted: true,
        sender: provider ?? '',
        advertiser: advertiserDomain,
        first_party: isFirstParty,
        event,
      };
    }
  }

  return {
    accepted: true,
    sender: provider ?? '',
    advertiser: advertiserDomain,
    first_party: isFirstParty,
    event,
  };
}

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

type ParseResult =
  | { ok: true; event: OcpEvent }
  | { ok: false; reason: OcpRejectionReason; detail?: string };

function parseAndValidateBody(
  bodyBytes: Uint8Array,
  receiverConfig: OcpReceiverBlock,
): ParseResult {
  let body: unknown;
  try {
    body = JSON.parse(utf8Decode(bodyBytes));
  } catch {
    return { ok: false, reason: 'malformed_json' };
  }

  if (!body || typeof body !== 'object') {
    return { ok: false, reason: 'malformed_json' };
  }
  const e = body as Record<string, unknown>;

  const required = [
    'ocp_spec_version',
    'ocp_clid',
    'ocp_pb',
    'id',
    'event_type',
    'timestamp',
  ] as const;
  for (const field of required) {
    if (e[field] === undefined || e[field] === null || e[field] === '') {
      return { ok: false, reason: 'missing_required_field', detail: field };
    }
  }
  if (
    !e.advertiser ||
    typeof e.advertiser !== 'object' ||
    typeof (e.advertiser as { domain?: unknown }).domain !== 'string'
  ) {
    return { ok: false, reason: 'missing_required_field', detail: 'advertiser.domain' };
  }
  if (typeof e.timestamp !== 'number' || !Number.isFinite(e.timestamp)) {
    return { ok: false, reason: 'missing_required_field', detail: 'timestamp' };
  }

  const supported = receiverConfig.supported_event_types;
  if (
    supported &&
    supported.length > 0 &&
    !supported.includes(e.event_type as EcapiEventType)
  ) {
    return { ok: false, reason: 'unsupported_event_type', detail: String(e.event_type) };
  }

  return { ok: true, event: body as OcpEvent };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Per SPEC.md § Idempotency: prefer (data_set_id, id), fall back to (advertiser.domain, id). */
export function computeDedupKey(event: OcpEvent): string {
  // Inputs have no spec-defined character constraints, so any delimiter
  // (a space, colon, NUL byte, etc.) either risks collisions or breaks
  // downstream storage (PostgreSQL TEXT rejects NUL). JSON-encode the
  // tuple so the result is unambiguous and printable.
  const scope = event.data_set_id
    ? { data_set_id: event.data_set_id }
    : { advertiser_domain: event.advertiser.domain };
  return JSON.stringify({ ...scope, id: event.id });
}

function headerLookup(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const target = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === target) return v;
  }
  return undefined;
}

function reject(
  reason: OcpRejectionReason,
  http_status: 400 | 401,
  detail?: string,
): OcpVerificationResult {
  return { accepted: false, reason, http_status, detail };
}

// ---------------------------------------------------------------------------
// Convenience: standalone first-party check (without full verification)
// ---------------------------------------------------------------------------

/**
 * Check whether a signed request is first-party (sender domain matches the
 * advertiser domain in the body). Useful for logging / metrics independent
 * of the full verification flow.
 */
export function isFirstPartyCapi(
  providerHeader: string | undefined,
  advertiserDomain: string,
): boolean {
  return !!providerHeader && providerHeader === advertiserDomain;
}

/**
 * Re-export for convenience: receivers may want to decode a click envelope
 * directly (e.g. when correlating an inbound conversion to a server-side
 * click log).
 */
export { decodeClickEnvelope } from './sender';

/**
 * Re-export base64url for receivers handling signature inputs.
 */
export { base64urlDecode };
