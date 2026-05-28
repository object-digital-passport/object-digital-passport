# Repository layout

| Path | Role |
|------|------|
| [`SPEC.md`](../SPEC.md) | **Normative** protocol (stays at repo root for visibility) |
| [`docs/`](README.md) | All non-spec documentation: GUIDE, releases, Android integration, contributing, security, conduct |
| [`web/`](../web/) | Reference static UI, WalletConnect loaders, [`odp-android-companion.js`](../web/odp-android-companion.js) |
| [`web/localization/`](../web/localization/) | UI strings (`en/`, `ru/`) and translated README/SPEC copies |
| [`web/e2e/`](../web/e2e/) | Playwright smoke tests (serve `web/` locally) |
| [`chain/contracts/`](../chain/contracts/) | Solidity sources |
| [`chain/deploy/`](../chain/deploy/) | Hardhat deploy, tests, `deployments/polygon.json` |
| [`chain/tools/`](../chain/tools/) | Python mint CLI and ABI helpers |
| [`chain/types/`](../chain/types/) | Generated/ethers TypeScript typings |
| [`chain/hardhat.config.ts`](../chain/hardhat.config.ts) | Hardhat config (run from `chain/` or `npm run …` at root) |

**Not in this repo:** [odp-android-companion](https://github.com/object-digital-passport/odp-android-companion) (NFC app).

**GitHub Pages** publishes [`web/`](../web/) (see [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)).
