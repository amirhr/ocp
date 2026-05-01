# Governance

## Current state (v0.1)

The Open Conversion Pingback (OCP) is currently maintained by its original author, **Amir Rad**, with sponsorship from **Whimful FZ-LLC**.

At this stage, the project operates as a **benevolent-dictator model**: the maintainer makes final decisions on spec content, accepts or declines pull requests, and arbitrates disagreements. This is intentional for v0.1. The spec is too early to benefit from formal multi-stakeholder governance, and the maintenance overhead of a working group at this stage would slow iteration.

This is not the long-term state. It is a starting point.

## Sponsorship vs. control

Whimful sponsors the initial drafting work. Whimful does **not** control the spec, has no special status in spec content, and is one CAPI provider among many that the spec is intended to serve. The licensing (CC-BY-4.0 + Apache-2.0 + the patent non-assertion in `PATENTS.md`) makes this enforceable rather than aspirational. Whimful cannot later assert proprietary rights over the spec, and neither can any other contributor.

Whimful's name appears in the `README.md` as the initial sponsor for honesty about provenance, not as a claim of ownership.

## Intent: move to a neutral home

The explicit goal is to move governance to a neutral, multi-stakeholder body once the spec is stable enough to warrant the overhead. Candidate homes, in order of current preference:

1. **IAB Tech Lab as an ECAPI extension.** OCP is positioned as a destination profile of [ECAPI 1.0](https://github.com/InteractiveAdvertisingBureau/ecapi). The cleanest long-term outcome is for OCP's additions (the click envelope, the federated SPF + DKIM + DMARC authentication model, the well-known file format, and the deletion endpoint) to be upstreamed into ECAPI itself. This makes OCP a coherent extension to a standard that already has IAB endorsement, rather than a parallel effort.

2. **Prebid.org.** Faster-moving and more aligned with open-web framing, but would require Prebid scope expansion beyond header bidding. Plausible if IAB is unwilling.

3. **Independent foundation.** Possible but expensive to operate; risks fragmentation. Last resort.

The spec will not move to a venue that requires giving up the open licensing terms in `LICENSE` and `PATENTS.md`. Any governance handoff must preserve royalty-free implementation rights for all parties.

## How decisions are made today

- **Editorial changes** (typos, clarification, formatting): accepted by the maintainer at their discretion.
- **Substantive spec changes**: discussed in an Issue or Discussion first. The maintainer aims to gather input from at least two independent contributors with domain expertise before merging.
- **Major design changes** (changing one of the three pingback mechanisms, modifying the privacy model defaults, restructuring the payload): require explicit Discussion thread, at least two weeks of public comment, and a written rationale in the merge commit or PR description.
- **Breaking changes to the wire format**: only at major version boundaries (v1.0, v2.0). The current draft is pre-v1; anything goes.

## Disagreements

If a contributor disagrees with a maintainer decision, the process is:

1. Raise it in the originating Issue or Discussion.
2. If unresolved, open a new Discussion explicitly framed as a governance question.
3. The maintainer commits to writing a public response with reasoning.
4. The contributor remains free to fork; the licensing guarantees this.

## Conflict of interest

The maintainer has a commercial interest in CAPI infrastructure (via Whimful). Where a spec decision could plausibly favor Whimful's commercial interests over those of other CAPI providers, publishers, or advertisers, the maintainer commits to:

- Disclosing the potential conflict in the relevant Issue or PR
- Soliciting input from at least one independent reviewer before deciding
- Preferring decisions that are neutral or that disadvantage Whimful relative to alternatives, as a tiebreaker

This is a partial mitigation, not a substitute for moving to neutral governance.

## Versioning

The spec uses semantic-ish versioning:

- **v0.x**: pre-release, breaking changes allowed at any time
- **v1.0**: first stable release, breaking changes only at major version
- **v1.x**: backwards-compatible additions and clarifications
- **v2.0**: first allowed breaking-change boundary after v1.0

A version bump of the spec implies a corresponding bump of the `ocp_spec_version` field in the wire payload (and the `v` field in the click envelope).
