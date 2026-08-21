# Documentation index

*Author: Andrei Chernikov*

*Friendly explainers (Quick Start, verification, NFC seals, Object ID, FAQ — 🇬🇧/🇷🇺) live on the [project Wiki](https://github.com/object-digital-passport/object-digital-passport/wiki).*

## Start here

| Document | Purpose |
|----------|---------|
| **[`REPOSITORY_LAYOUT.md`](REPOSITORY_LAYOUT.md)** | Where `docs/`, `web/frontend/`, and `chain/` live in the repo. |
| **[`releases/`](releases/)** | **Start here for “what changed and does it affect me”** — one short, jargon-free note per version. Written to [`.github/RELEASE_TEMPLATE.md`](../.github/RELEASE_TEMPLATE.md). |
| **[`GUIDE.md`](GUIDE.md)** | Long-form overview: quick start, live demo, costs, deployment table, glossary. |
| **[`SPEC.md`](../SPEC.md)** (root) | **Normative** protocol: `passport.json`, on-chain fields, verification, **§15 `.odpass`**. |
| **[`V0.6.md`](V0.6.md)** | Current v0.6 line (on-chain generation **6**, deployed on Polygon mainnet): on-chain card, `anchors[]`, append-only events. RU: [`web/frontend/localization/ru/RELEASE_v0.6.md`](../web/frontend/localization/ru/RELEASE_v0.6.md). |
| **[`RELEASE_v0.6.md`](RELEASE_v0.6.md)** | v0.6 release notes: deployed addresses, EIP-170 numbers, `ODPAuthorAttestation`, JSON Schema and docs updates. |
| **[`REQUIREMENTS_FIELDS_V0.6.md`](REQUIREMENTS_FIELDS_V0.6.md)** | v0.6 storage-model design rationale and field tables (in Russian). |
| **[`chain/deploy/README.md`](../chain/deploy/README.md)** | Hardhat deploy (`.env`, compile, Polygon mainnet). |
| **[`VERSIONING_AND_RELEASES.md`](VERSIONING_AND_RELEASES.md)** | Git tags, `main`, hotfix vs feature branches. |
| **[`SECURITY.md`](SECURITY.md)** | Threat model & trust boundaries. RU: [`web/frontend/localization/ru/SECURITY.md`](../web/frontend/localization/ru/SECURITY.md). |
| **[`ANDROID.md`](ANDROID.md)** | Web handoff + trust boundaries; app code in [odp-android-companion](https://github.com/object-digital-passport/odp-android-companion). |
| **[`ANDROID_NTAG424DNA_TAGTAMPER.md`](ANDROID_NTAG424DNA_TAGTAMPER.md)** | Practical NTAG424 TagTamper workflow (ODP web + carrier + companion). |
| **[`PROTOCOL_TRACKS.md`](PROTOCOL_TRACKS.md)** | Track A (audit) vs Track B (mint agent); EIP-170 pointer. |
| **[`EIP170_STRATEGY.md`](EIP170_STRATEGY.md)** | Bytecode size limit options before mainnet deploy. |

## Historical / planning

| Document | Purpose |
|----------|---------|
| [`V0.5.md`](V0.5.md) | Historical v0.5 line (on-chain generation **5**) — deployed to Polygon mainnet, never tagged, superseded by v0.6. See [`releases/v0.5.md`](releases/v0.5.md). |
| [`V0.3.md`](V0.3.md) | v0.3 vs v0.2; RU release: [`web/frontend/localization/ru/RELEASE_v0.3.md`](../web/frontend/localization/ru/RELEASE_v0.3.md). |
| [`V0.4.md`](V0.4.md) | Historical v0.4 line notes. |
| [`RELEASE_v0.4.1.md`](RELEASE_v0.4.1.md) | v0.4.1 patch notes. RU: [`web/frontend/localization/ru/RELEASE_v0.4.1.md`](../web/frontend/localization/ru/RELEASE_v0.4.1.md). |
| [`archive/DOCS_REVIEW_PLAN_v0.5.md`](archive/DOCS_REVIEW_PLAN_v0.5.md) | Completed planning note (README/SPEC/docs pass). |
| [`ANDROID_VERIFIER_MVP.md`](ANDROID_VERIFIER_MVP.md) | Short MVP scope; [`ANDROID_COMPANION_APP.md`](ANDROID_COMPANION_APP.md) redirects to companion repo. |
| [`research/UNIT_CODE_AUTHENTICATION_LANDSCAPE.md`](research/UNIT_CODE_AUTHENTICATION_LANDSCAPE.md) | How mass-market unit codes actually work (Pop Mart and peers), how v0.7 §20 compares, and what to change. Primary sources; unverified claims marked in place. |
| [`EDITION_ISSUER_TOOL.md`](EDITION_ISSUER_TOOL.md) | **Implementation handoff** for the issuer-side edition tool: algorithms, byte-level encodings, outputs, ceremony, contract call, and the known-answer vectors to check against. |
| [`EDITION_UNIT_KEYS.md`](EDITION_UNIT_KEYS.md) | **v0.7 draft** — edition passports + per-unit activation keys for mass-produced series (B profile). RU: [`web/frontend/localization/ru/EDITION_UNIT_KEYS.md`](../web/frontend/localization/ru/EDITION_UNIT_KEYS.md). |
| [`IDEAS_V1.md`](IDEAS_V1.md) | Informal v1 directions (not spec). |
| [`community/discussion-passport-ui-v0.4-EN.md`](community/discussion-passport-ui-v0.4-EN.md) | Draft GitHub Discussion (EN). |

## `.odpass` bundle (quick pointer)

- **Format:** ZIP **`.odpass`**; required `passport.json` + `manifest.json`; sidecar bytes under `originals/` — **SPEC §15**.
- **Reference manifest:** **SPEC §15.1.1** (`format: odp-bundle`, `bundleVersion: "0.1"`).
- **Implementations:** `createPassportOdpBlob` in **`web/frontend/passport.html`** and **`chain/tools/mint.py`**.
- **Hosting:** public `dataUrl` must serve the §15 ZIP (HTTPS); **`web/frontend/verify.html`** rejects bare `.json` URLs — **SPEC §9**, **§11** step 5.

---

*Short entry: root [`README.md`](../README.md). Russian index: [`web/frontend/localization/ru/docs/README.md`](../web/frontend/localization/ru/docs/README.md).*
