# Object Digital Passport — Release notes · v0.4 (reference site & docs)

These notes describe **what changed in the repository between the v0.3 protocol snapshot and this v0.4 reference line** — mainly **static web UI**, **WalletConnect integration**, **SPEC/documentation**, and **community process**. They are **not** a new on-chain registry generation: the **reference Polygon deployment remains the v0.3 line** (`CONTRACT_VERSION` / generation **3**) — see the **Current release** table in [`README.md`](README.md). Normative protocol rules stay in [`SPEC.md`](SPEC.md).

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
