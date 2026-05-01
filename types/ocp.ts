/**
 * Open Conversion Pingback (OCP) v0.1 — TypeScript types
 *
 * OCP is a destination profile of IAB Tech Lab's ECAPI 1.0.
 * The wire payload IS an ECAPI 1.0 event with three OCP-specific top-level
 * fields. Authentication is federated and modeled on email's SPF + DKIM +
 * DMARC: senders sign with published public keys, advertisers declare
 * authorized senders, destinations declare auth policy.
 *
 * See SPEC.md for normative semantics. Where this file disagrees with
 * SPEC.md, SPEC.md is authoritative.
 */

import type { EcapiEvent } from './ecapi';

export type OcpSpecVersion = '0.1';

// ---------------------------------------------------------------------------
// Click envelope
// ---------------------------------------------------------------------------

/**
 * The click envelope. Carried as a base64url-encoded JSON object in the
 * `ecapi` query parameter on click URLs. Keys are abbreviated to minimize
 * URL length.
 *
 *   https://advertiser.com/landing?ecapi=<base64url-encoded JSON>
 */
export interface OcpClickEnvelope {
  /** Spec version. Currently "0.1". */
  v: OcpSpecVersion;
  /** Pingback URL (HTTPS). */
  pb: string;
  /** Click ID minted by the destination. Opaque to the advertiser. */
  clid: string;
  /** Optional dataset ID identifying the advertiser account on the receiver. */
  dsid?: string;
}

// ---------------------------------------------------------------------------
// Conversion request
// ---------------------------------------------------------------------------

/** OCP-specific identifier of the advertiser sending the conversion. */
export interface OcpAdvertiser {
  /** Advertiser's primary domain. Required. */
  domain: string;
  /** Advertiser's own internal account identifier. Optional. */
  id?: string;
}

/**
 * The OCP conversion request body — an ECAPI 1.0 event with three OCP
 * additions and a required `advertiser` object. Sent as the JSON body of
 * an HTTP POST to the pingback URL.
 */
export interface OcpEvent extends EcapiEvent {
  /** OCP spec version. */
  ocp_spec_version: OcpSpecVersion;
  /** Click ID copied from the envelope. */
  ocp_clid: string;
  /** Pingback URL copied from the envelope. */
  ocp_pb: string;
  /** Advertiser identification. Required. */
  advertiser: OcpAdvertiser;

  /** Required in OCP (strongly recommended in ECAPI). */
  id: string;
  /** Required in OCP. Unix epoch seconds. */
  timestamp: number;
  /** Required in OCP. */
  event_type: EcapiEvent['event_type'];
}

/** HTTP headers required on every OCP conversion request. */
export interface OcpRequestHeaders {
  'OCP-Spec-Version': OcpSpecVersion;
  /** Domain of the entity sending the request. */
  'OCP-Provider': string;
  /** Key id matching a `kid` in the sender's well-known file. */
  'OCP-Key-Id': string;
  /** Base64url-encoded signature over the raw request body. */
  'OCP-Signature': string;
}

// ---------------------------------------------------------------------------
// Well-known file: /.well-known/ocp.json
// ---------------------------------------------------------------------------

/** Supported signature algorithms. Ed25519 is required; ECDSA is optional. */
export type OcpSignatureAlgorithm = 'Ed25519' | 'ECDSA-P256';

/** A public key entry in a sender's well-known file. */
export interface OcpKey {
  /** Key identifier. Referenced from `OCP-Key-Id` header. */
  kid: string;
  /** Algorithm. */
  alg: OcpSignatureAlgorithm;
  /** Base64-encoded public key (raw key bytes for Ed25519, SPKI DER otherwise). */
  pub: string;
}

/**
 * Sender block. Published by:
 *   - Third-party CAPI providers (declares signing keys)
 *   - Advertisers running first-party CAPI (declares signing keys; publishing
 *     keys implicitly authorizes the entity to sign for itself)
 *   - Advertisers using third-party providers (declares authorized providers)
 */
export interface OcpSenderBlock {
  /** Public keys this entity uses to sign requests. Required for senders. */
  keys?: OcpKey[];
  /**
   * Domains authorized to send events on this entity's behalf when this
   * entity appears in `advertiser.domain`. SPF-equivalent. Does not need
   * to include the entity's own domain — first-party signing is implicit
   * once the entity has published keys.
   */
  authorized_providers?: string[];
}

/**
 * Receiver block. Published by destinations (publishers, walled gardens,
 * networks, anyone receiving events).
 */
export interface OcpReceiverBlock {
  /** Auth requirement. Defaults to "signed". */
  auth_required?: 'signed' | 'none';
  /** If true, verify advertiser's authorized_providers list. SPF-equivalent. */
  verify_advertiser_authorization?: boolean;
  /**
   * Allowlist of third-party CAPI provider domains. Empty/absent = open mode.
   * First-party senders (OCP-Provider == advertiser.domain) are always
   * accepted regardless of this list.
   */
  authorized_providers?: string[];
  /** URL where senders go to onboard / obtain pre-shared secrets. */
  onboarding_url?: string;
  /** URL accepting deletion requests for right-to-be-forgotten. */
  deletion_endpoint?: string;
  /** Event types the destination ingests. Empty/absent = all. */
  supported_event_types?: EcapiEvent['event_type'][];
  /** Maximum age of accepted requests, in seconds. Default 300. */
  max_timestamp_skew_seconds?: number;
  /** If true, additionally require pre-shared HMAC signature. */
  preshared_secret_required?: boolean;
}

/** The unified well-known file structure at /.well-known/ocp.json. */
export interface OcpWellKnown {
  spec_version: OcpSpecVersion;
  /** Present if the entity acts as a sender or as an authorizing advertiser. */
  sender?: OcpSenderBlock;
  /** Present if the entity acts as a receiver. */
  receiver?: OcpReceiverBlock;
}

// ---------------------------------------------------------------------------
// Verification results
// ---------------------------------------------------------------------------

/** Reason a request was rejected, mapped to an HTTP status code. */
export type OcpRejectionReason =
  | 'malformed_json'
  | 'missing_required_field'
  | 'unsupported_event_type'
  | 'timestamp_out_of_window'
  | 'sender_well_known_unavailable'
  | 'unknown_key_id'
  | 'invalid_signature'
  | 'advertiser_well_known_unavailable'
  | 'sender_not_authorized_by_advertiser'
  | 'sender_not_authorized_by_receiver'
  | 'preshared_secret_required'
  | 'replay_detected'
  | 'unsigned_not_allowed';

/**
 * Outcome of verifying an inbound conversion request. The verifier itself
 * only ever rejects with 400 (schema-class) or 401 (auth-class). Other
 * codes from SPEC.md § Response codes are transport-layer concerns the
 * caller handles before/after invoking the verifier — 404 if the route
 * is unmounted, 429 from upstream rate limiting, 500 for unhandled errors.
 */
export type OcpVerificationResult =
  | {
      accepted: true;
      sender: string;
      advertiser: string;
      first_party: boolean;
      event: OcpEvent;
    }
  | {
      accepted: false;
      reason: OcpRejectionReason;
      detail?: string;
      http_status: 400 | 401;
    };
