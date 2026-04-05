# Object Digital Passport — Release notes · v0.4

This document summarizes the **v0.4 line** in this repository (**`main`**): **on-chain bytecode** (generation **4**, optional **`ODPCounterfeitConcern`** satellite), **static web** (WalletConnect, session restore), **SPEC / documentation**, and **community** drafts. Normative rules: **[`SPEC.md`](SPEC.md)**.

**Deployment note:** The **default Polygon addresses** listed in [`README.md`](README.md) and [`deploy/deployments/polygon.json`](deploy/deployments/polygon.json) may still correspond to an earlier **generation 3** deployment until you **redeploy** v0.4 bytecode and update **`NET.*`**. Always pair **chain + contract address + ABI** to what you actually verify against.

---

## On-chain (EIP-170)

- **Packed `CONTRACT_VERSION` is `4`** at mint and in `submitProof` (same **v0.3-shaped** `Passport` tuple as generation **3** deploys; minor bump via **`SPEC_MINOR`**). The main registry remains intended to deploy under the **24 KiB** creation limit on Polygon.
- **Public getters removed** from the reference main-registry bytecode to save size: **`SPEC_MAJOR()`**, **`SPEC_MINOR()`**, **`MONTHLY_LIMIT_C()`**, **`MONTHLY_LIMIT_B()`**. Use **`CONTRACT_VERSION`**, **`getRemainingMints`**, and normative limits **C = 1000**, **B = 100_000** from SPEC / source.
- **`ODPPassportLib`**: NFC `nfcModel` remains **`NTAG424DNA_TT`** only (TagTamper).
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
- **SPEC:** ODP-DNS / URI (`odp://`, legacy `odpc://` note) and **§19** resolver clarifications — [`SPEC.md`](SPEC.md), [`localization/ru/SPEC.md`](localization/ru/SPEC.md).
- **Web polish:** cache-bust for Profile styles; profile card tweaks.
- **Community:** [`docs/community/discussion-passport-ui-v0.4-EN.md`](docs/community/discussion-passport-ui-v0.4-EN.md); optional [`scripts/gh-create-discussion-from-doc.sh`](scripts/gh-create-discussion-from-doc.sh).

### README / visuals

- **SPEC §17** and README describe WalletConnect alongside injected wallets; banner images: [`docs/images/`](docs/images/).

---

## Earlier lines

- **v0.3 vs v0.2 (on-chain):** [`RELEASE_v0.3.md`](RELEASE_v0.3.md)
- **Short pointer:** [`docs/V0.4.md`](docs/V0.4.md)
- **Versioning model:** [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md)
