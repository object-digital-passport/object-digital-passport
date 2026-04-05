# Object Digital Passport — Release notes · v0.4 (reference site & docs)

These notes describe **what changed on the `main` branch** after the v0.3 on-chain line — mainly **static web UI**, **WalletConnect integration**, **SPEC/documentation**, and **community process**. They are **not** a new **deployed** registry generation for the **reference Polygon addresses** in [`README.md`](README.md): those stay **v0.3** (`CONTRACT_VERSION` packed byte **3**) until you deploy something else. Normative protocol rules stay in [`SPEC.md`](SPEC.md).

### P / M and “fake” (counterfeit) — do not confuse with this doc set

- The **reference v0.3** `ObjectDigitalPassport` bytecode **does not** include on-chain **`raiseCounterfeitConcern` / `getCounterfeitConcern`** (removed for EIP-170) — see [`RELEASE_v0.3.md`](RELEASE_v0.3.md) and **SPEC** (counterfeit section). **P** and **M** profiles can still document disputes or methodology **off-chain** (`passport.json`, **`submitProof`**, linked reports). The shipped web UI shows legacy on-chain counterfeit controls **only if** the connected ABI still exposes those functions (typical **older v0.2** deployments).
- **Separate work** exists on Git branch **`v0.4`**: an **`ODPCounterfeitConcern`** satellite plus packed generation **4** (e.g. commit `0e86ec4` — not an ancestor of **`main`** at the time these notes were updated). That line is **not** what you get by checking out **`main`**. Merge and redeploy before claiming an on-chain **v0.4** registry.

### README / SPEC touch-ups (also on `main`)

- **SPEC §17** and root **README** describe WalletConnect alongside injected wallets; **README** banner images live under [`docs/images/`](docs/images/).

## Summary

| Area | What changed |
|:-----|:-------------|
| **Wallets** | [**WalletConnect v2**](https://docs.reown.com/) (Reown / `@walletconnect/ethereum-provider`) on **Profile** and **Passport** so mobile wallets (e.g. Tangem) and QR-based flows work alongside injected EIP-1193 browsers. Config: [`web/odp-wc-config.js`](web/odp-wc-config.js); lazy-loaded bundle: [`web/odp-wallet-wc-loader.js`](web/odp-wallet-wc-loader.js) → [`web/odp-wallet-wc.bundle.js`](web/odp-wallet-wc.bundle.js) (build: `npm run build:wc` in `web/`). |
| **Session persistence** | After a full **page reload** or **navigation** between `passport.html` and `creator.html`, a **WalletConnect session is restored** when possible (no repeated QR if the provider still has a persisted session). Implemented via **`odpWalletConnectTryRestoreSession`** in [`web/odp-wallet-wc.entry.js`](web/odp-wallet-wc.entry.js) and init hooks in those pages. |
| **SPEC** | **ODP-DNS / URI schemes** (`odp://`, legacy `odpc://` non-normative note) and **§19 resolver profile** clarifications — English [`SPEC.md`](SPEC.md) and Russian [`localization/ru/SPEC.md`](localization/ru/SPEC.md). |
| **Web polish** | **Cache-bust** for styles on **Profile** (`creator.html` + `odp.css`) for GitHub Pages. **Creator profile** layout/copy tweaks (wallet line emphasis, “publish everywhere” label alignment, ellipsis on long addresses — with follow-up revert where needed). |
| **Community** | English **GitHub Discussion draft** for passport **UI vs standard** toward v0.4: [`docs/community/discussion-passport-ui-v0.4-EN.md`](docs/community/discussion-passport-ui-v0.4-EN.md). Optional publisher script: [`scripts/gh-create-discussion-from-doc.sh`](scripts/gh-create-discussion-from-doc.sh) (requires [`gh`](https://cli.github.com/) + Discussions enabled). Indexed in [`docs/README.md`](docs/README.md). |

## Files to know (WalletConnect)

- **Source:** [`web/odp-wallet-wc.entry.js`](web/odp-wallet-wc.entry.js) — `odpWalletConnectTryRestoreSession`, `odpWalletConnectConnect`, `odpWalletConnectDisconnect`, singleton accessors.
- **Integration:** [`web/passport.html`](web/passport.html), [`web/creator.html`](web/creator.html) — connect menu, chain switch, single-account guard, auto-restore on load when there is no injected `eth_accounts` session.

## See also

- **v0.3 vs v0.2 (on-chain):** [`RELEASE_v0.3.md`](RELEASE_v0.3.md)
- **Short pointer:** [`docs/V0.4.md`](docs/V0.4.md)
- **Versioning model:** [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md)
