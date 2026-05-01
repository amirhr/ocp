# Contributing to OCP

Thanks for your interest in shaping the Open Conversion Pingback. The spec is in early draft (v0.1) and feedback is the single most valuable contribution right now.

## Ways to contribute

**Discussions**: for open-ended questions, design feedback, "have you considered X" conversations, and ecosystem context. Use [GitHub Discussions](../../discussions). No issue or PR is required.

**Issues**: for specific spec defects, ambiguities, or concrete change proposals. Open an [issue](../../issues) with:

- A clear title naming the section or concept (e.g. "Click ID format: 256-char limit may be insufficient for hashed publisher namespacing")
- The problem you observed
- A proposed change, if you have one
- Any relevant context (your role, what you're trying to implement, what spec text you're reading)

**Pull requests**: for spec text changes. Small editorial fixes (typos, clarity) can be sent as a PR directly. Larger structural changes should start as a Discussion or Issue first so the design can be debated before someone invests in writing.

## What good feedback looks like at this stage

- "The click envelope's base64url encoding adds N% to URL length and tools X and Y will strip it." Concrete, specific, identifies a real-world constraint.
- "The privacy model's k-anonymity threshold of 10 is too low for small advertisers; here's what GDPR-aligned advisors typically recommend." Domain expertise applied to a specific section.
- "Ed25519 isn't supported on platform X; the spec needs ECDSA P-256 as a normative alternative." Implementation reality applied to a crypto choice.
- "Walled garden Y already does something close to this with proprietary signing, here's where it differs and why." Comparative analysis from someone close to the practice.

## What we're not ready for yet

- Reference implementation code (the spec is too unstable to implement against)
- Formal protocol verification or test suites (premature)
- Conformance test vectors (also premature)

When the spec stabilizes (v0.5+), these will be welcome.

## Licensing

By submitting a Contribution, you agree that:

- Your Contribution to the specification text is licensed under [Creative Commons Attribution 4.0 International](./LICENSE).
- Your Contribution to any code is licensed under the [Apache License 2.0](./LICENSE-CODE).
- You agree to the patent grant and non-assertion terms in [PATENTS.md](./PATENTS.md).
- You have the right to make the Contribution under these terms (i.e., the work is yours, or you have permission from your employer or the copyright holder).

No separate Contributor License Agreement signing is required. Submitting a PR or issue with technical content constitutes agreement.

## Code of Conduct

All participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Governance

See [GOVERNANCE.md](./GOVERNANCE.md) for how decisions are made and how the project intends to evolve.
