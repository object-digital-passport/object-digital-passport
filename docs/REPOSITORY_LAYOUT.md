# Repository layout

## Product code (three folders)

| Path | Role |
|------|------|
| [`SPEC.md`](../SPEC.md) | **Normative** protocol (English, at repo root on purpose) |
| [`docs/`](README.md) | Guides, contributing, security, release notes, images |
| [`web/`](../web/) | Static UI, i18n, e2e tests |
| [`chain/`](../chain/) | Solidity, Hardhat, deploy, `mint.py`, contract types |

**Android NFC app:** [odp-android-companion](https://github.com/object-digital-passport/odp-android-companion) (separate repository).

## Why `.github/` and `.gitignore` appear at the root

GitHub and Git require these **at the repository root**. They are not duplicates of `docs/` or `web/`:

| Path | Why it must stay here |
|------|------------------------|
| [`.github/`](../.github/) | Actions (Pages deploy), issue templates, org profile — [see `.github/README.md`](../.github/README.md) |
| [`.gitignore`](../.gitignore) | Excludes `.env`, `node_modules/`, build artifacts — standard Git location |

You cannot move them into `docs/` without breaking GitHub Pages and community features.

## Why GitHub shows the same commit message on many files

After a large rename, the file browser shows the **last commit that touched each path**. One restructuring commit updates hundreds of paths at once, so the message repeats until later commits change individual folders. That is normal GitHub UI behavior, not duplicate descriptions inside the files.

## Commands

```bash
cd chain && npm install && npm run compile && npm test
```

Serve the web UI locally: `cd web && python3 -m http.server 8080` → open `/verify.html`.
