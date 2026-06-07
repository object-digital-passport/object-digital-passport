# Repository layout

| Path | Role |
|------|------|
| [`SPEC.md`](../SPEC.md) | **Normative** protocol (English, at repo root) |
| [`docs/`](README.md) | Guides, contributing, security, release notes |
| [`web/frontend/`](../web/frontend/) | HTML, CSS, UI scripts, i18n |
| [`web/backend/`](../web/backend/) | Contract/RPC client JS, WalletConnect, registry config |
| [`chain/`](../chain/) | Solidity, Hardhat, deploy, `mint.py`, contract types |

**Android NFC app:** [odp-android-companion](https://github.com/object-digital-passport/odp-android-companion) (separate repository).

## Commands

```bash
cd chain && npm install && npm run compile && npm test
```

Serve locally: see [web/README.md](../web/README.md) → `/verify.html`.
