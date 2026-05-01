/**
 * OCP sender-side helpers.
 *
 * Pure functions for the advertiser / CAPI-provider side of the protocol:
 *   - Encoding the click envelope into the `ecapi` URL parameter
 *   - Building a signed conversion request from an envelope + event
 *
 * Cryptographic operations (signing) are abstracted via injectable signers
 * so the same helpers work in browsers (Web Crypto), Node (Web Crypto or
 * node:crypto), and edge runtimes (Workers, Deno, Bun) without changes.
 *
 * No I/O. These helpers do not perform HTTP requests; the caller decides
 * how to send the constructed request.
 */

import type {
  OcpClickEnvelope,
  OcpEvent,
  OcpRequestHeaders,
  OcpSpecVersion,
} from './ocp';
import type { EcapiEvent } from './ecapi';

// ---------------------------------------------------------------------------
// Click envelope: encode / decode
// ---------------------------------------------------------------------------

/** Encode an envelope to the base64url string that goes in `?ecapi=…`. */
export function encodeClickEnvelope(env: OcpClickEnvelope): string {
  validateClickEnvelope(env);
  const json = JSON.stringify(env);
  return base64urlEncode(utf8Encode(json));
}

/**
 * Decode the `ecapi` parameter back into an envelope. Throws if the encoding
 * is malformed or required fields are missing.
 */
export function decodeClickEnvelope(encoded: string): OcpClickEnvelope {
  let json: string;
  try {
    json = utf8Decode(base64urlDecode(encoded));
  } catch {
    throw new OcpEnvelopeError('malformed_base64url');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new OcpEnvelopeError('malformed_json');
  }

  const env = parsed as Partial<OcpClickEnvelope>;
  validateClickEnvelope(env);
  return env as OcpClickEnvelope;
}

/** Append `?ecapi=…` (or `&ecapi=…`) to a landing URL. */
export function appendEnvelopeToLandingUrl(
  landingUrl: string,
  env: OcpClickEnvelope,
): string {
  const encoded = encodeClickEnvelope(env);
  const sep = landingUrl.includes('?') ? '&' : '?';
  return `${landingUrl}${sep}ecapi=${encoded}`;
}

/** Pull the `ecapi` parameter out of a URL, if present. */
export function extractEnvelopeFromUrl(url: string): OcpClickEnvelope | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const encoded = parsed.searchParams.get('ecapi');
  if (!encoded) return null;
  return decodeClickEnvelope(encoded);
}

// ---------------------------------------------------------------------------
// Conversion request: build + sign
// ---------------------------------------------------------------------------

/**
 * Abstract signer. Implementations adapt to whatever crypto API the runtime
 * provides (Web Crypto, node:crypto, libsodium, HSM, etc.). The function
 * receives the raw bytes to sign and returns a base64url signature.
 */
export type OcpSigner = (bodyBytes: Uint8Array) => Promise<string>;

/** Inputs to {@link buildSignedRequest}. */
export interface OcpBuildRequestInput {
  /** The click envelope captured from the landing-page session. */
  envelope: OcpClickEnvelope;
  /** The ECAPI event payload (without OCP-specific fields). */
  event: EcapiEvent;
  /** Advertiser identification for the body. */
  advertiser: { domain: string; id?: string };
  /** Sender domain (CAPI provider domain or advertiser's own domain). */
  provider: string;
  /** Key id matching a `kid` in the sender's well-known file. */
  keyId: string;
  /** Signer function. Receives raw body bytes, returns base64url signature. */
  signer: OcpSigner;
  /** Optional override of spec version. Defaults to "0.1". */
  specVersion?: OcpSpecVersion;
}

/** Built, signed request ready for the caller to POST to `envelope.pb`. */
export interface OcpBuiltRequest {
  url: string;
  method: 'POST';
  headers: OcpRequestHeaders & { 'Content-Type': 'application/json' };
  body: string;
  bodyBytes: Uint8Array;
}

/**
 * Build a fully-formed signed OCP conversion request. The caller is
 * responsible for the actual HTTP transport.
 */
export async function buildSignedRequest(
  input: OcpBuildRequestInput,
): Promise<OcpBuiltRequest> {
  const specVersion: OcpSpecVersion = input.specVersion ?? '0.1';

  const ocpEvent: OcpEvent = {
    ...input.event,
    ocp_spec_version: specVersion,
    ocp_clid: input.envelope.clid,
    ocp_pb: input.envelope.pb,
    advertiser: { ...input.advertiser },
    id: requireString(input.event.id, 'event.id'),
    timestamp: requireNumber(input.event.timestamp, 'event.timestamp'),
    event_type: input.event.event_type,
  };

  if (input.envelope.dsid && !ocpEvent.data_set_id) {
    ocpEvent.data_set_id = input.envelope.dsid;
  }

  const body = canonicalJsonStringify(ocpEvent);
  const bodyBytes = utf8Encode(body);
  const signature = await input.signer(bodyBytes);

  return {
    url: input.envelope.pb,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'OCP-Spec-Version': specVersion,
      'OCP-Provider': input.provider,
      'OCP-Key-Id': input.keyId,
      'OCP-Signature': signature,
    },
    body,
    bodyBytes,
  };
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export class OcpEnvelopeError extends Error {
  constructor(public readonly code: string, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'OcpEnvelopeError';
  }
}

function validateClickEnvelope(env: Partial<OcpClickEnvelope>): void {
  if (!env || typeof env !== 'object') {
    throw new OcpEnvelopeError('not_an_object');
  }
  if (env.v !== '0.1') {
    throw new OcpEnvelopeError('unsupported_spec_version', String(env.v));
  }
  if (typeof env.pb !== 'string' || !env.pb.startsWith('https://')) {
    throw new OcpEnvelopeError('invalid_pingback_url');
  }
  if (typeof env.clid !== 'string' || env.clid.length === 0) {
    throw new OcpEnvelopeError('invalid_click_id');
  }
  if (env.clid.length > 256) {
    throw new OcpEnvelopeError('click_id_too_long');
  }
  if (env.dsid !== undefined && typeof env.dsid !== 'string') {
    throw new OcpEnvelopeError('invalid_dataset_id');
  }
}

function requireString(v: unknown, name: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new OcpEnvelopeError(`missing_required_field`, name);
  }
  return v;
}

function requireNumber(v: unknown, name: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new OcpEnvelopeError(`missing_required_field`, name);
  }
  return v;
}

// ---------------------------------------------------------------------------
// Encoding primitives (base64url, UTF-8, canonical JSON)
// ---------------------------------------------------------------------------

/**
 * Canonical JSON stringify. Currently uses standard JSON.stringify; spec
 * v0.1 signs over the raw body bytes as sent. If a future spec version
 * adopts JSON Canonicalization Scheme (RFC 8785), swap this implementation.
 */
export function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(value);
}

export function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function base64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlDecode(s: string): Uint8Array {
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
