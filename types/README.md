# OCP TypeScript Types and Helpers

Machine-checkable TypeScript representations of the OCP and ECAPI payload schemas, plus helper functions covering the verification flows on both the sender and receiver sides. These files are reference material. They document the wire format in a form a compiler can verify, and provide a starting point for CAPI providers, advertisers running first-party CAPI, and publisher backends implementing OCP.

## Files

- **`ecapi.ts`**: Types for IAB Tech Lab's [ECAPI 1.0](https://github.com/InteractiveAdvertisingBureau/ecapi) payload, schemas, and enumerations. Maintained as a faithful TypeScript representation of the upstream spec; treat the upstream spec as authoritative if there is any drift.
- **`ocp.ts`**: OCP-specific types extending `EcapiEvent`. Covers the click envelope (`OcpClickEnvelope`), conversion request body (`OcpEvent`), required headers (`OcpRequestHeaders`), the unified well-known file (`OcpWellKnown` with `OcpSenderBlock` and `OcpReceiverBlock`), and the verification result discriminated union (`OcpVerificationResult`).
- **`sender.ts`**: Helper functions for the advertiser / CAPI-provider side: encoding the click envelope (`encodeClickEnvelope`, `appendEnvelopeToLandingUrl`), decoding it on landing (`decodeClickEnvelope`, `extractEnvelopeFromUrl`), and building a fully-formed signed conversion request (`buildSignedRequest`). Cryptographic operations are abstracted via an injectable `OcpSigner` so the same helpers work in browsers, Node, and edge runtimes.
- **`receiver.ts`**: Helper functions for the destination side: end-to-end verification of an inbound request (`verifyInboundRequest`) implementing all six checks from SPEC.md (schema, timestamp, sender authentication, advertiser authorization, receiver policy, idempotency). I/O dependencies (well-known fetching, signature verification, dedup lookup) are abstracted via injectable functions.

## Status

These files track **OCP v0.1** and **ECAPI 1.0**. They will move alongside the spec as it evolves.

The helpers in `sender.ts` and `receiver.ts` are pure where possible. They do not perform HTTP requests directly; transport is the caller's responsibility. They do not bind to a specific crypto library; signature operations are passed in as functions. This keeps the helpers usable from any JavaScript runtime (browsers via Web Crypto, Node via Web Crypto or `node:crypto`, Cloudflare Workers, Deno, Bun) without forcing a runtime choice on the implementer.

What's intentionally *not* here yet:

- A reference HTTP transport binding
- A reference crypto binding (Ed25519 via Web Crypto, etc.)
- A JSON Schema generated from the types
- An SDK with retry / batching / persistence

Those layers are appropriate work for downstream implementers. If you build any of them, please contribute back via [Discussions](../../discussions).

## Source pin

`ecapi.ts` is generated from a specific revision of the upstream ECAPI specification. Pinning lets anyone detect drift with a single diff.

| | Value |
|---|---|
| Upstream file | `ecapi_1.0.md` in [InteractiveAdvertisingBureau/ecapi](https://github.com/InteractiveAdvertisingBureau/ecapi) |
| Last upstream commit touching that file | `604fc2fae4140346abf63f7af53a225a60918cbd` (2026-03-27) |
| Upstream repo HEAD seen at generation time | `d1ee99d878cf8fb6a78da1bc8e74af960d3b0ee7` (2026-04-28) |
| Date `ecapi.ts` was generated | 2026-05-01 |
| Spec license at that commit | CC-BY 3.0 |

**Pinned-revision link** (compare against this):
https://github.com/InteractiveAdvertisingBureau/ecapi/blob/604fc2fae4140346abf63f7af53a225a60918cbd/ecapi_1.0.md

**Live-version link** (where future drift will appear):
https://github.com/InteractiveAdvertisingBureau/ecapi/blob/main/ecapi_1.0.md

### Re-pinning procedure

When updating `ecapi.ts` to a newer ECAPI revision:

1. Look up the most recent commit touching `ecapi_1.0.md` upstream.
2. Update the source-pin block at the top of `ecapi.ts` and the table above.
3. In the commit message, include both the old and new pin SHAs so reviewers can run the upstream diff directly.

## Authoritative source

Where these files disagree with the prose specifications, the prose specifications win:

- For ECAPI fields: [`ecapi_1.0.md` in InteractiveAdvertisingBureau/ecapi](https://github.com/InteractiveAdvertisingBureau/ecapi/blob/main/ecapi_1.0.md) (see Source pin above for the exact revision these types match)
- For OCP fields and verification flow: [`SPEC.md`](../SPEC.md) in this repository

File issues against this repo if you spot drift in either direction.

## Licensing

These TypeScript files are part of the OCP repository and are licensed under the [Apache License 2.0](../LICENSE-CODE) for use as code, alongside the [CC-BY-4.0](../LICENSE) terms that cover the spec text they document. Contributing changes is governed by [PATENTS.md](../PATENTS.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).

The ECAPI specification itself is licensed by IAB Tech Lab under CC-BY 3.0; the TypeScript representation in `ecapi.ts` is a derivative work permitted under that license, attributed to IAB Tech Lab.
