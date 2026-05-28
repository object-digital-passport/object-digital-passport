# Object Digital Passport · v0.5 Alpha

![Object Digital Passport cover](docs/images/odp-cover-en.png)

**Object Digital Passport (ODP)** is an open standard for verifiable object authenticity on a public registry (Polygon in this reference build).

| | |
| --- | --- |
| **Try it** | [Verify](https://object-digital-passport.github.io/object-digital-passport/verify.html) · [Profile](https://object-digital-passport.github.io/object-digital-passport/creator.html) · [Passport](https://object-digital-passport.github.io/object-digital-passport/passport.html) |
| **Rules (normative)** | [SPEC.md](SPEC.md) |
| **Full overview (EN)** | [docs/GUIDE.md](docs/GUIDE.md) |
| **Android companion** | [odp-android-companion](https://github.com/object-digital-passport/odp-android-companion) · [docs/ANDROID.md](docs/ANDROID.md) |
| **Docs** | [docs/README.md](docs/README.md) · [Contributing](docs/CONTRIBUTING.md) · [Security](docs/SECURITY.md) |
| **Русский** | [web/localization/ru/README.md](web/localization/ru/README.md) |
| **License** | [MIT](LICENSE) |

## Repository layout

| Path | Contents |
|------|----------|
| **[SPEC.md](SPEC.md)** | Normative protocol (English) |
| **[docs/](docs/)** | Guides, release notes, contributing, security, images |
| **[web/](web/)** | Static UI (GitHub Pages), i18n, e2e smoke tests |
| **[chain/](chain/)** | Solidity, Hardhat, deploy scripts, `mint.py`, contract types |

```bash
npm install && npm run compile   # from repo root (delegates to chain/)
cd chain && npm test
```

Details: [docs/REPOSITORY_LAYOUT.md](docs/REPOSITORY_LAYOUT.md).
