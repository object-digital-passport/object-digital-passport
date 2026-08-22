# Contributing

Thanks for your interest in Object Digital Passport.

**Author:** Andrei Chernikov — original specification, contract, web UI, and tooling in this repository unless otherwise noted in a file.

## Code of conduct

This project follows the **[Contributor Covenant](CODE_OF_CONDUCT.md)**. By participating, you agree to uphold it. Reports: see **Enforcement** in that file.

## Language (GitHub and the community)

**Issues, pull requests, and maintainer replies on GitHub are in English** so everyone in the community can follow the same thread. The normative specification is `**[SPEC.md](../SPEC.md)`** (English). Translations under [`frontend/localization/`](https://github.com/object-digital-passport/object-digital-passport.github.io/tree/main/frontend/localization) **in the website repository** are informational; discussion that changes the protocol should still be tracked in English on GitHub.

## Where to start

- Read the normative protocol in `**[SPEC.md](../SPEC.md)**` and the overview in `**[README.md](README.md)**`.
- **Good first issues:** look for issues labeled `**good first issue`** or `**help wanted**` (maintainers apply these when tasks are suitable for newcomers).
- **Gaps in the standard:** if something feels **missing or underspecified** in `**SPEC.md`**, open a **Standard gap** issue (template) — short proposals welcome.
- **Spec / protocol ideas:** open a **Specification / protocol discussion** issue (template) for questions or changes to existing rules, or discuss before large PRs.
- **Security:** do **not** post exploitable details in public issues — follow `**[SECURITY.md](SECURITY.md)`** (Russian: `[ru/SECURITY.md](ru/SECURITY.md)`).

## Fork and pull request (short)

1. **Fork** this repository on GitHub (or ask for **collaborator** access on the org if you work closely with maintainers).
2. **Branch** from `main` with a descriptive name, e.g. `fix/verify-mobile`, `docs/contributing-typos`.
3. **Change** with focused commits; match existing style in each area (`chain/contracts/`, `chain/tools/`, `schema/`, Markdown). The web interface is a **[separate repository](https://github.com/object-digital-passport/object-digital-passport.github.io)** with its own contributing guide.
4. **Test** what you can locally (static pages, Hardhat, `mint.py`) — there may not be CI for every path yet.
5. **Open a PR** into `**main`** — the PR template will prompt for summary and checklist.
6. **Respond** to review feedback; maintainers aim to reply within a few days (small projects vary by availability).

## Beyond code

Reviews of English and translated copy, UX, visual design, accessibility, and localization ([`frontend/localization/`](https://github.com/object-digital-passport/object-digital-passport.github.io/tree/main/frontend/localization), in the website repository) are as valuable as patches to contracts or JS. The project aims for a **stable protocol and product line toward January 2027**; broad feedback on `[SPEC.md](../SPEC.md)` and the static pages helps.

## Areas of the repo


| Area             | Notes                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `**SPEC.md`**    | Breaking changes need discussion; pin spec version for implementers.                          |
| `**chain/contracts/**` | On-chain immutability: many fixes require a **new deployment** and version line — note in PR. |
| `schema/`        | JSON Schema, conformance examples, known-answer vectors. `passport.json` `registration.*` must stay **UTC-only** (no device-local IANA zone; `localIso8601` only `+00:00`) — [SPEC.md](../SPEC.md) (registration instant). |
| `**chain/deploy/**`    | Hardhat; never commit private keys.                                                           |
| `**chain/tools/**`     | Python CLI; document new flags in `--help` or README.                                         |


## Style

- **Markdown:** follow existing headings and tone in nearby files.
- **JavaScript:** the tooling here is Node ESM (`chain/tools/`, `tools/`). Browser JavaScript lives in the [website repository](https://github.com/object-digital-passport/object-digital-passport.github.io).
- **Solidity:** match `ObjectDigitalPassport.sol` style and comments.

## Issue labels (for maintainers)

Suggested labels to create in **Issues → Labels** (helps contributors find work):


| Label              | Use                                   |
| ------------------ | ------------------------------------- |
| `good first issue` | Small, well-scoped, good for first PR |
| `help wanted`      | Maintainer would like community help  |
| `bug`              | Something broken                      |
| `enhancement`      | Feature or improvement                |
| `spec`             | Protocol / SPEC.md related            |
| `documentation`    | Docs / copy only                      |


GitHub’s default `**good first issue`** and `**help wanted**` are widely recognized ([community health](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions)).

## Versions and “freezing” a line

This project ties **released** work to **git tags** (e.g. `**v0.1`**).  
How `**main**`, tags, and patch releases interact is documented in `**[docs/VERSIONING_AND_RELEASES.md](VERSIONING_AND_RELEASES.md)**`.

## Maintainer setup (branch protection) — optional, enable later

If you want `**main**` to accept changes only via pull requests, follow `**[.github/BRANCH_PROTECTION.md](../.github/BRANCH_PROTECTION.md)**` and turn the rules on in **GitHub → Settings**. Not required for contributors day-to-day.

## Optional: GitHub Discussions

**Discussions** can be enabled under **Settings → Features** for Q&A and ideas that are not yet actionable issues. Optional for small projects.

---

*License: see [LICENSE](../LICENSE) and [README](README.md).*