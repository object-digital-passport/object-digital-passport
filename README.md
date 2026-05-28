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

| Folder / file | Contents |
|---------------|----------|
| **[SPEC.md](SPEC.md)** | Normative protocol |
| **[docs/](docs/)** | Documentation and community files |
| **[web/](web/)** | Reference web UI (GitHub Pages) |
| **[chain/](chain/)** | Smart contracts, deploy, Hardhat |
| **`.github/`** | GitHub Actions and templates ([why at root?](docs/REPOSITORY_LAYOUT.md#why-github-and-gitignore-appear-at-the-root)) |
| **`.gitignore`** | Git ignore rules (required at repository root) |

Contract tooling: `cd chain && npm install && npm run compile`

Details: [docs/REPOSITORY_LAYOUT.md](docs/REPOSITORY_LAYOUT.md)
