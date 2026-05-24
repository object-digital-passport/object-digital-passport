# Documentation index

*Author: Andrei Chernikov*

| Document | Purpose |
|----------|---------|
| **[`GUIDE.md`](GUIDE.md)** | **Long-form project overview (English):** what ODP is, quick start, live demo, costs, deployment table, glossary — formerly the root `README.md`. |
| **[`SPEC.md`](../SPEC.md)** (root) | **Normative** protocol: `passport.json`, on-chain fields, verification, **§15 `.odpass` bundle**. |
| **[`PROTOCOL_TRACKS.md`](PROTOCOL_TRACKS.md)** | **Non-normative:** Track A (audit backlog) vs Track B (mint agent shipped), EIP-170 pointer. |
| **[`EIP170_STRATEGY.md`](EIP170_STRATEGY.md)** | Bytecode size limit: options before mainnet deploy. |
| **[`deploy/README.md`](../deploy/README.md)** | Step-by-step Hardhat deploy (`.env`, compile, Polygon mainnet); EIP-170 gate before `polygon`. |
| **[`VERSIONING_AND_RELEASES.md`](VERSIONING_AND_RELEASES.md)** | Git tags, `main`, hotfix branches vs feature lines. |
| **[`V0.2-DRAFT.md`](V0.2-DRAFT.md)** | Historical / exploratory notes (folder-first hosting, hash boundaries). Several items have since landed in **SPEC v0.2**; read **SPEC** for what is binding. |
| **[`V0.3.md`](V0.3.md)** | **v0.3 vs v0.2:** [`localization/ru/RELEASE_v0.3.md`](../localization/ru/RELEASE_v0.3.md); deploy / **`NET.*`:** [`../deploy/README.md`](../deploy/README.md); **SPEC**. |
| **[`V0.4.md`](V0.4.md)** | Historical v0.4 line notes and release pointers. |
| **[`V0.5.md`](V0.5.md)** | Current v0.5 line overview, shaped by real-world feedback and practical testing. |
| **[`ANDROID_NTAG424DNA_TAGTAMPER.md`](ANDROID_NTAG424DNA_TAGTAMPER.md)** | Practical Android workflow for `NTAG424DNA_TAGTAMPER`: ODP web + TagWriter + Tag TrustLink, with carrier vs chip-authentication vs passport-binding split made explicit. |
| **[`ANDROID_VERIFIER_MVP.md`](ANDROID_VERIFIER_MVP.md)** | Scope for a dedicated Android verifier MVP: what it must verify, and what TagWriter / Tag TrustLink can and cannot do. |
| **[`ANDROID_COMPANION_APP.md`](ANDROID_COMPANION_APP.md)** | Build/run guide and current scope for the separate temporary local `android-companion/` repo in this workspace: GitHub Verify first-link now, URL-first `odp:off` carrier flow, and staged chip-binding interfaces. |
| **[`RELEASE_v0.4.1.md`](RELEASE_v0.4.1.md)** | Historical v0.4.1 patch notes (SRI, GitHub templates, Hardhat 3, typings). RU: [`../localization/ru/RELEASE_v0.4.1.md`](../localization/ru/RELEASE_v0.4.1.md). |
| **[`SECURITY.md`](../SECURITY.md)** | Threat model & trust boundaries for the current reference line. RU: [`localization/ru/SECURITY.md`](../localization/ru/SECURITY.md). |
| **[`DOCS_REVIEW_PLAN_v0.5.md`](DOCS_REVIEW_PLAN_v0.5.md)** | Discussion-first review plan for restructuring README/SPEC/docs after the v0.5 model lock. |
| **[`IDEAS_V1.md`](IDEAS_V1.md)** | Informal **v1** directions (not spec); includes notes on retiring **`freeze()`**-style global lock. |
| **[`community/discussion-passport-ui-v0.4-EN.md`](community/discussion-passport-ui-v0.4-EN.md)** | English draft for a **GitHub Discussion** (reference passport UI vs spec, toward v0.4). Publish with **`scripts/gh-create-discussion-from-doc.sh`** after `gh auth login`. |

## `.odpass` bundle (quick pointer)

- **Format:** ZIP with extension **`.odpass`**; required `passport.json` + `manifest.json`; sidecar bytes under `originals/` with paths in `manifest.originals` (v0.3) — see **SPEC §15** (legacy top-level `original/*` / `image*/*` layouts are not normative).
- **Reference manifest schema:** **SPEC §15.1.1** (`format: odp-bundle`, `bundleVersion: "0.1"`).
- **Implementations in this repo:** `createPassportOdpBlob` in **`web/passport.html`** and **`tools/mint.py`** after a successful CLI mint — same layout and manifest fields.
- **Hosting:** public `dataUrl` **must** serve the **§15 `.odpass`** ZIP (HTTPS); **`web/verify.html`** rejects bare `.json` URLs and requires a ZIP body — see **SPEC §9** and **§11** step 5.

---

Android companion note: `../android-companion/` is currently a **separate temporary local Git repo inside the same workspace**, intended to become its own GitHub project later. This `docs/` folder keeps the ODP-side integration and scope notes only.

*For user-facing setup and hosting, start from the root [`README.md`](../README.md) (short) or [`GUIDE.md`](GUIDE.md) (detailed). Russian docs index: [`localization/ru/docs/README.md`](../localization/ru/docs/README.md).*
