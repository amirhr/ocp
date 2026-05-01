# Open Conversion Pingback (OCP)

[![Status: Working Draft v0.1](https://img.shields.io/badge/spec-v0.1%20working%20draft-orange)](./SPEC.md)
[![Spec license: CC-BY-4.0](https://img.shields.io/badge/spec_license-CC--BY--4.0-blue)](./LICENSE)

> An open, vendor-neutral protocol for delivering post-click conversion signals to any destination on the open wire: publishers, walled gardens, ad networks, affiliate networks. The federated counterpart to proprietary `gclid`/`fbclid`/`ttclid` flows.

**Status:** Working draft, v0.1, not for implementation
**Spec:** [SPEC.md](./SPEC.md)
**Reference types:** [types/](./types)
**Discussion:** [GitHub Discussions](../../discussions) · [Issues](../../issues)

## What this is

Walled gardens (Google, Meta, TikTok, Snap) get post-click conversion signal back from advertisers via conversion pixels, but more importantly, Conversions API integrations. They use that signal to optimize targeting algorithms, ad delivery, build lookalikes, and improve UX. The open web has no equivalent, and there is no protocol that lets a non-walled-garden destination receive conversion events from advertisers using the same envelope, the same authentication model, and the same discovery primitives as the walled gardens.

OCP defines that protocol. Three primitives:

1. **A click envelope.** A single base64url-encoded `ecapi` query parameter carrying everything needed to fire a conversion: pingback URL, click ID, optional dataset ID. Self-contained, no registry lookups required.
2. **An [ECAPI 1.0](https://github.com/InteractiveAdvertisingBureau/ecapi)-compatible conversion request.** HTTP POST to the pingback URL, signed with the sender's published Ed25519 key.
3. **A unified well-known file.** `/.well-known/ocp.json` published by every participating entity, declaring its role (sender, receiver, or both) and configuration.

Authentication uses a federated SPF + DKIM + DMARC model adapted for HTTP. No central registry. No bearer tokens to leak. Any sender can implement OCP without permission. Any destination can receive OCP without registration. The specification is intended to be secure and truly open.

## Who this is for

- **Advertisers running first-party CAPI** who want to send conversion data to publishers, walled gardens, and ad networks without writing a different integration for each.
- **Third-party CAPI providers** who want a new destination type they can implement once and serve to all of their advertisers.
- **Publishers** who want the conversion signal walled gardens already have, to inform yield management, audience products, direct-sales pricing, etc.
- **Walled gardens** who want a vendor-neutral, open-protocol path that can replace or complement their proprietary CAPI surfaces.
- **Ad-tech vendors** (SSPs, DSPs, yield managers) who want a new data input that flows into bidding and pricing models.

## Relationship to IAB ECAPI

OCP is designed as a **destination profile of [IAB Tech Lab's ECAPI 1.0](https://github.com/InteractiveAdvertisingBureau/ecapi)** (released January 2026), not a competing payload format.

ECAPI standardizes the payload format for advertiser→platform conversion events. It explicitly defers endpoint discovery and authentication to "partner specific" arrangements. OCP fills exactly that gap: the wire payload **is** an ECAPI 1.0 event with three additional fields, and the novel parts are the click envelope, the federated authentication model, and the well-known file format.

The long-term goal is to upstream OCP into ECAPI as the standard destination profile.

See [SPEC.md § Relationship to existing work](./SPEC.md#relationship-to-existing-work) for the full landscape including Privacy Sandbox ARA, WebKit PCM, and vendor-specific publisher CAPIs.

## Status and roadmap

This is a v0.1 working draft. It is **not** ready for implementation. The current focus is gathering feedback from publisher ad ops, DSP/SSP engineers, CAPI providers, walled-garden engineering, and privacy practitioners.

Near-term:

- Open feedback period via Issues and Discussions
- Iterate toward v0.2 incorporating community input
- Engage IAB Tech Lab about upstreaming into ECAPI as the destination profile

## How to participate

- **Read** [SPEC.md](./SPEC.md)
- **Comment** on the design via [Discussions](../../discussions) for open-ended questions or [Issues](../../issues) for specific spec defects or proposals
- **Propose changes** via pull request. See [CONTRIBUTING.md](./CONTRIBUTING.md).

All participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Reference TypeScript types

The [`types/`](./types) directory contains TypeScript type definitions for ECAPI 1.0, OCP v0.1, and helper validation functions covering the sender and receiver verification flows. These are reference material. They document the wire format in a form a compiler can verify, and provide a starting point for implementations. See [types/README.md](./types/README.md) for the source-pin policy that ties `types/ecapi.ts` to a specific upstream commit.

## Licensing

This specification is published under terms designed to keep it permanently open and royalty-free:

- **Specification text:** [Creative Commons Attribution 4.0 International (CC-BY-4.0)](./LICENSE)
- **Reference code:** [Apache License 2.0](./LICENSE-CODE), which includes an explicit patent grant
- **Patent posture:** see [PATENTS.md](./PATENTS.md). Contributors grant a royalty-free patent license to anyone implementing the spec, with a defensive termination clause if any party initiates patent litigation against the spec or its implementations.

If you cannot accept these terms, do not contribute.

## Governance

See [GOVERNANCE.md](./GOVERNANCE.md). Currently maintained by the original author with the explicit intent to move to a neutral working-group home as the spec matures.

## Author and sponsor

Authored by **[Amir Rad](https://linkedin.com/in/amirhr)**. Initial work sponsored by **[Whimful FZ-LLC](https://whimful.com)**, a CAPI provider for the open web. Whimful has no special status in the spec; it is one CAPI provider among many that this protocol is intended to serve.

## Prior art and defensive publication

This document is published openly to establish prior art and to ensure no party can later claim exclusive patent rights over the techniques described herein. See [PATENTS.md](./PATENTS.md) for the full non-assertion pledge.
