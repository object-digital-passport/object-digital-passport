# Object Digital Passport — Release notes · v0.4

This document summarizes the **v0.4 line** in this repository (**`main`**): **on-chain bytecode** (generation **4**, optional **`ODPCounterfeitConcern`** satellite), **static web** (WalletConnect, session restore), **SPEC / documentation**, and **community** drafts. Normative rules: **[`SPEC.md`](SPEC.md)**.

**Deployment note:** The **default Polygon addresses** in [`README.md`](README.md) and [`deploy/deployments/polygon.json`](deploy/deployments/polygon.json) are the **generation 4** (`CONTRACT_VERSION` packed byte **4**) deployment used by the static pages’ **`NET.*`**. If you deploy your own registry, set **`NET.contract`**, **`NET.docAnchor`**, and **`NET.counterfeitConcern`** (and **`previousContracts`** on Verify as needed) to match **chain + contract address + ABI**.

### Registry correction — UTC month in `ODP-…` / `PRF-…` (why v0.4 stays **0.4**)

**What was wrong:** In the first reference build, `year` and `month` passed to `mintDigital` / `mintPhysical` (and to `submitProof`) were only range-checked. A caller could supply an arbitrary calendar pair (e.g. **2000-01**) and receive **`ODP-2000-01-…`** even when the block was in another month — a serious abuse of the human-readable prefix.

**What was fixed:** The contract now requires those arguments to match the **Gregorian UTC** year and month of **`block.timestamp`** (implemented via **`ODPPassportLib.utcYearMonthFromTimestamp`**; mismatch → **`EC(68)`**). The same rule applies to extension mints and to **`submitProof`** for the **`PRF-YYYY-MM-…`** prefix. The web mint path uses **UTC** (`getUTCFullYear` / `getUTCMonth+1`) so it aligns with chain validation. Normative text: **[`SPEC.md`](SPEC.md)** (§2, §8, §9).

**Deployment story:** A **v0.4** registry was deployed first; the **time / naming** issue was spotted **immediately**. That early deployment was **frozen** (do not use for new mints), and the **reference bytecode + SPEC** were updated to enforce UTC alignment. Because the problem was caught right away — before the line was treated as stable for production — the protocol **stays on the v0.4 line**: packed **`CONTRACT_VERSION` = 4** is unchanged; there is no bump to **0.5** solely for this fix. Older generation-4 deployments without the check remain separate registries; pair **address + ABI** correctly.

---

## On-chain (EIP-170)

- **Packed `CONTRACT_VERSION` is `4`** at mint and in `submitProof` (same **v0.3-shaped** `Passport` tuple as generation **3** deploys; minor bump via **`SPEC_MINOR`**). The main registry remains intended to deploy under the **24 KiB** creation limit on Polygon.
- **Public getters removed** from the reference main-registry bytecode to save size: **`SPEC_MAJOR()`**, **`SPEC_MINOR()`**, **`MONTHLY_LIMIT_C()`**, **`MONTHLY_LIMIT_B()`**. Use **`CONTRACT_VERSION`**, **`getRemainingMints`**, and normative limits **C = 1000**, **B = 100_000** from SPEC / source.
- **`ODPPassportLib`**: NFC `nfcModel` remains **`NTAG424DNA_TT`** only (TagTamper). Includes **`utcYearMonthFromTimestamp`** and UTC mint-month enforcement (see **Registry correction** above); **`EC(83)`** on unsupported timestamp paths; **`EC(68)`** when mint/proof `year`/`month` ≠ UTC calendar of the block.
- **`ODPCounterfeitConcern`** (new **satellite**): **`raiseCounterfeitConcern`**, **`clearCounterfeitConcern`**, **`getCounterfeitConcern`** — **P** and **M** profiles only; only the raising profile may clear. Constructor pins one **`ObjectDigitalPassport`** address. Integrators must use an **`IODPRegistryForCounterfeit`-compatible `getCreator` return** (struct layout) when wiring another registry.

### Satellite custom errors (`ODPCounterfeitConcern`)

- **80** — already active  
- **81** — not active  
- **82** — clear unauthorized  

**Deploy order:** **`ODPPassportLib`** → **`ObjectDigitalPassport`** → optional **`ODPWalletDocumentAnchor`** / **`ODPCounterfeitConcern`** — see **[`deploy/README.md`](deploy/README.md)**.

---

## Web (`NET.counterfeitConcern` and WalletConnect)

- **`NET.counterfeitConcern`**: optional satellite address; must be deployed against the same **`NET.contract`** as the main registry. Helpers: **`odpCounterfeitReadContract`** / **`odpCounterfeitWriteContract`** in [`web/odp-contract.js`](web/odp-contract.js).
- Passport mint UI falls back to **1000** / **100_000** for tier limits when on-chain getters are absent.
- [**WalletConnect v2**](https://docs.reown.com/) (Reown / `@walletconnect/ethereum-provider`) on **Profile** and **Passport**; config [`web/odp-wc-config.js`](web/odp-wc-config.js); bundle [`web/odp-wallet-wc-loader.js`](web/odp-wallet-wc-loader.js) → [`web/odp-wallet-wc.bundle.js`](web/odp-wallet-wc.bundle.js) (build: `npm run build:wc` in `web/`).
- **Session persistence:** after **reload** or **navigation** between `passport.html` and `creator.html`, **`odpWalletConnectTryRestoreSession`** in [`web/odp-wallet-wc.entry.js`](web/odp-wallet-wc.entry.js) restores a persisted WC session when possible.
- **SPEC:** `odp://` URI and **§19** resolver notes — [`SPEC.md`](SPEC.md), [`localization/ru/SPEC.md`](localization/ru/SPEC.md).
- **Web polish:** cache-bust for Profile styles; profile card tweaks.
- **Community:** [`docs/community/discussion-passport-ui-v0.4-EN.md`](docs/community/discussion-passport-ui-v0.4-EN.md); optional [`scripts/gh-create-discussion-from-doc.sh`](scripts/gh-create-discussion-from-doc.sh).

### README / visuals

- **SPEC §17** and README describe WalletConnect alongside injected wallets; banner images: [`docs/images/`](docs/images/).

---

## Earlier lines

- **v0.3 vs v0.2 (on-chain):** [`RELEASE_v0.3.md`](RELEASE_v0.3.md)
- **Short pointer:** [`docs/V0.4.md`](docs/V0.4.md)
- **Versioning model:** [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md)
