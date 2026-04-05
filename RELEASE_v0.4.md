# Object Digital Passport — Release notes · v0.4

This document describes the **v0.4 line** on branch **`main`**: **on-chain** generation **4** (optional **`ODPCounterfeitConcern`** satellite), **static web** (WalletConnect, session restore), **SPEC / docs**, and **localization**. Normative protocol rules remain in **[`SPEC.md`](SPEC.md)**.

**Deployment:** Default **Polygon** addresses in [`README.md`](README.md) and [`deploy/deployments/polygon.json`](deploy/deployments/polygon.json) target **generation 4** (`CONTRACT_VERSION` packed byte **4**) used by the pages’ **`NET.*`**. For a self-hosted registry, set **`NET.contract`**, **`NET.docAnchor`**, **`NET.counterfeitConcern`**, and **`previousContracts`** (Verify) to match **chain + address + ABI**.

---

## Highlights

| Area | What’s in v0.4 |
|------|----------------|
| **On-chain** | Packed **`CONTRACT_VERSION` = 4**; optional **`ODPCounterfeitConcern`** (P/M); **UTC calendar** enforcement for `ODP-…` / `PRF-…` prefixes (see **Registry correction** below). |
| **Web** | WalletConnect v2 + session restore on Profile / Passport; **Verify** tools (document attest/check, **P-affiliation on-chain audit**); **Passport** P/M flows (attestation + **institutional concern** when the satellite is wired). |
| **UX / theme** | Blue theme: readable text on **white cards** (hints, ghost buttons); **Verify / Passport** tool subnav (**Back** without stray borders, title on the right). |
| **i18n** | English and Russian strings for new flows; RU copy avoids raw English where the UI is user-facing. |
| **Docs** | [`README.md`](README.md) cover banners ([`docs/readme/`](docs/readme/)); Shields.io **License** / **Stars** badges; SPEC and release pointers updated with the stack. |

---

## Registry correction — UTC month in `ODP-…` / `PRF-…` (why the line stays **v0.4**)

**What was wrong:** In the first reference build, `year` and `month` passed to `mintDigital` / `mintPhysical` (and to `submitProof`) were only range-checked. A caller could supply an arbitrary calendar pair (e.g. **2000-01**) and receive **`ODP-2000-01-…`** even when the block was in another month — a serious abuse of the human-readable prefix.

**What was fixed:** The contract now requires those arguments to match the **Gregorian UTC** year and month of **`block.timestamp`** (via **`ODPPassportLib.utcYearMonthFromTimestamp`**; mismatch → **`EC(68)`**). The same rule applies to extension mints and to **`submitProof`** for the **`PRF-YYYY-MM-…`** prefix. The web mint path uses **UTC** (`getUTCFullYear` / `getUTCMonth+1`) so it aligns with chain validation. Normative text: **[`SPEC.md`](SPEC.md)** (§2, §8, §9).

**Deployment story:** A **v0.4** registry was deployed first; the **time / naming** issue was spotted **immediately**. That early deployment was **frozen** (do not use for new mints), and the **reference bytecode + SPEC** were updated to enforce UTC alignment. Because the problem was caught before the line was treated as stable for production, the protocol **stays on v0.4**: packed **`CONTRACT_VERSION` = 4** is unchanged; there is no bump to **0.5** solely for this fix. Older generation-4 deployments without the check remain separate registries; pair **address + ABI** correctly.

---

## On-chain (EIP-170)

- **Packed `CONTRACT_VERSION` is `4`** at mint and in `submitProof` (same **v0.3-shaped** `Passport` tuple as generation **3** deploys; minor bump via **`SPEC_MINOR`**). The main registry remains intended to deploy under the **24 KiB** creation limit on Polygon.
- **Public getters removed** from the reference main-registry bytecode to save size: **`SPEC_MAJOR()`**, **`SPEC_MINOR()`**, **`MONTHLY_LIMIT_C()`**, **`MONTHLY_LIMIT_B()`**. Use **`CONTRACT_VERSION`**, **`getRemainingMints`**, and normative limits **C = 1000**, **B = 100_000** from SPEC / source.
- **`ODPPassportLib`**: NFC `nfcModel` remains **`NTAG424DNA_TT`** only (TagTamper). Includes **`utcYearMonthFromTimestamp`** and UTC mint-month enforcement; **`EC(83)`** on unsupported timestamp paths; **`EC(68)`** when mint/proof `year`/`month` ≠ UTC calendar of the block.
- **`ODPCounterfeitConcern`** (new **satellite**): **`raiseCounterfeitConcern`**, **`clearCounterfeitConcern`**, **`getCounterfeitConcern`** — **P** and **M** profiles only; only the raising profile may clear. Constructor pins one **`ObjectDigitalPassport`** address. Integrators must use an **`IODPRegistryForCounterfeit`-compatible `getCreator` return** (struct layout) when wiring another registry.

### Satellite custom errors (`ODPCounterfeitConcern`)

| Code | Meaning |
|------|---------|
| **80** | Already active |
| **81** | Not active |
| **82** | Clear unauthorized |

**Deploy order:** **`ODPPassportLib`** → **`ObjectDigitalPassport`** → optional **`ODPWalletDocumentAnchor`** / **`ODPCounterfeitConcern`** — see **[`deploy/README.md`](deploy/README.md)**. Helper scripts in-repo include **`deploy/deploy.sh`** and **`deploy/scripts/freeze-registry.js`** (operator workflows; see script headers).

---

## Web (`NET.*`, WalletConnect, flows)

- **`NET.counterfeitConcern`**: optional satellite address; must be deployed against the same **`NET.contract`** as the main registry. Helpers: **`odpCounterfeitReadContract`** / **`odpCounterfeitWriteContract`** in [`web/odp-contract.js`](web/odp-contract.js).
- Passport mint UI falls back to **1000** / **100_000** for tier limits when on-chain getters are absent.
- [**WalletConnect v2**](https://docs.reown.com/) (Reown / `@walletconnect/ethereum-provider`) on **Profile** and **Passport**; config [`web/odp-wc-config.js`](web/odp-wc-config.js); bundle [`web/odp-wallet-wc-loader.js`](web/odp-wallet-wc-loader.js) → [`web/odp-wallet-wc.bundle.js`](web/odp-wallet-wc.bundle.js) (build: `npm run build:wc` in `web/`).
- **Session persistence:** after **reload** or **navigation** between `passport.html` and `creator.html`, the WalletConnect layer restores a persisted session when possible.
- **Passport (P / M):** optional **institutional attestation** for an existing passport (file hash + optional URL), and—when **`NET.counterfeitConcern`** is set—**institutional concern** (structured hash; no free-text on-chain). UI strings in [`localization/en/passport.json`](localization/en/passport.json) / [`localization/ru/passport.json`](localization/ru/passport.json).
- **Verify:** **P-affiliation on-chain audit** (read-only: parent + join/detach timestamps) for child **P-…** IDs when the registry exposes **`getPAffiliationAudit`**. Tool menu + workspace use a **subnav** row (Back + current tool title); ghost **Back** is styled for **white cards** under the blue theme.
- **SPEC / URI:** `odp://` and resolver notes — [`SPEC.md`](SPEC.md), [`localization/ru/SPEC.md`](localization/ru/SPEC.md).
- **Community draft:** [`docs/community/discussion-passport-ui-v0.4-EN.md`](docs/community/discussion-passport-ui-v0.4-EN.md); optional [`scripts/gh-create-discussion-from-doc.sh`](scripts/gh-create-discussion-from-doc.sh).

### README / branding

- Cover images: [`docs/readme/odp_cover_en.png`](docs/readme/odp_cover_en.png) (EN README), [`docs/readme/odp_cover_ru.png`](docs/readme/odp_cover_ru.png) (RU README).
- Badges: **License (MIT)** and **GitHub stars** (Shields.io) at the top of the READMEs.

---

## Tests & tooling

- Hardhat tests under **`deploy/test/`** include registry behaviour and **`ODPPassportLib`** UTC edge cases (see **`ObjectDigitalPassport.test.js`**, **`ODPPassportLib.test.js`**).

---

## Earlier lines & pointers

- **Security model (threats, trust boundaries, satellite):** [`SECURITY.md`](SECURITY.md) · RU: [`localization/ru/SECURITY.md`](localization/ru/SECURITY.md)
- **v0.3 vs v0.2 (on-chain):** [`RELEASE_v0.3.md`](RELEASE_v0.3.md)
- **Short pointer:** [`docs/V0.4.md`](docs/V0.4.md)
- **Versioning model:** [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md)
