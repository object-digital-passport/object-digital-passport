# Repository layout

| Path | Role |
|------|------|
| [`SPEC.md`](../SPEC.md) | **Normative** protocol (English, at repo root) |
| [`docs/`](README.md) | Guides, contributing, security, release notes |
| [`web/`](../web/) | Static UI, i18n, e2e tests |
| [`chain/`](../chain/) | Solidity, Hardhat, deploy, `mint.py`, contract types |

**Android NFC app:** [odp-android-companion](https://github.com/object-digital-passport/odp-android-companion) (separate repository).

## Commands

```bash
cd chain && npm install && npm run compile && npm test
```

Serve the web UI locally: `cd web && python3 -m http.server 8080` → open `/verify.html`.
