<h1 align="center">Object Digital Passport</h1>

<p align="center">
  <b>An open standard for giving a real object a passport anyone can verify.</b><br>
  Art, limited runs, archives — a readable on-chain card, cryptographic anchors,<br>
  append-only history, and a public registry with no company in the middle.
</p>

<p align="center">
  <a href="https://object-digital-passport.github.io/verify.html"><b>Verify something</b></a> ·
  <a href="https://object-digital-passport.github.io/">Website</a> ·
  <a href="https://object-digital-passport.github.io/object-digital-passport/spec/">Specification</a> ·
  <a href="https://github.com/object-digital-passport/object-digital-passport/wiki">Wiki</a> ·
  <a href="https://github.com/object-digital-passport/object-digital-passport/discussions">Discussions</a>
</p>

<p align="center">
  <a href="https://github.com/object-digital-passport/object-digital-passport/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License"></a>
  <a href="https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md"><img src="https://img.shields.io/badge/spec-v0.7%20draft-orange.svg" alt="Spec v0.7 draft"></a>
  <a href="https://polygonscan.com/address/0x012aC6393464A73EC16131D701ff2e000695b91b"><img src="https://img.shields.io/badge/registry-Polygon%20mainnet-8247e5.svg" alt="Deployed on Polygon mainnet"></a>
  <a href="https://github.com/object-digital-passport/object-digital-passport/actions/workflows/ci.yml"><img src="https://github.com/object-digital-passport/object-digital-passport/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

---

## What it does

A passport proves three things about an object, and keeps proving them without anyone's server
staying alive:

- **When** it was registered — a blockchain timestamp nobody can backdate.
- **Who** registered it — a public profile ID you cross-check on the issuer's own site.
- **That its description has not changed since** — cryptographic fingerprints of every photo,
  measurement, and distinguishing feature.

Verifying is **free, forever, and needs no wallet**. Registering costs the network fee alone
(~$0.01–0.03 on Polygon). The protocol charges nothing, ever, and is MIT-licensed end to end.

---

## Repositories

| | |
|:--|:--|
| **[object-digital-passport](https://github.com/object-digital-passport/object-digital-passport)** | **The standard.** `SPEC.md`, Solidity contracts, JSON Schema, conformance vectors, deploy tooling. |
| **[object-digital-passport.github.io](https://github.com/object-digital-passport/object-digital-passport.github.io)** | **The reference website.** Everything that runs in a browser: verify, profile and passport pages. |
| **odp-apple-app** | iOS app — issue, carry and check passports; NFC seals and a non-custodial wallet. *Private while it is pre-release.* |
| **odp-android-companion** | Android NFC verifier — NTAG 424 DNA / TagTamper scans. *Private while it is pre-release.* |

---

## Where things stand

> **Alpha.** Each `v0.x` is a **separate on-chain registry generation**, not an upgrade — passports
> do not migrate between them. For work that has to last decades, wait for **v1 — target January 2027**.

| Line | State |
|:--|:--|
| **v0.6** | **Deployed on Polygon mainnet** (generation 6). This is what the reference site and apps talk to, and where passports are issued today. |
| **v0.7** | **Pre-release, deployed nowhere.** Edition passports and per-unit activation keys: contracts and tests are done; no issuer tooling and no activation page exist yet. Published so the design can be argued with before it is set in a contract. |
| **v0.5** | Superseded. Still readable in Verify, no longer the target for new passports. |

---

## Start here

- **Friendly guides** — [Wiki](https://github.com/object-digital-passport/object-digital-passport/wiki): Quick Start, how verification works, NFC seals, Object ID, FAQ (🇬🇧 / 🇷🇺)
- **The standard** — [`SPEC.md`](https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md) · [rendered](https://object-digital-passport.github.io/object-digital-passport/spec/)
- **Detailed guide and addresses** — [`docs/GUIDE.md`](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/GUIDE.md)
- **What is in v0.7** — [release note](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/releases/v0.7.md) · [full changelog](https://github.com/object-digital-passport/object-digital-passport/blob/main/CHANGELOG.md)
- **Repository layout** — [`docs/REPOSITORY_LAYOUT.md`](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/REPOSITORY_LAYOUT.md)
- **NFC seals on Android** — [`docs/ANDROID_NTAG424DNA_TAGTAMPER.md`](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/ANDROID_NTAG424DNA_TAGTAMPER.md)
- **Security model** — [`docs/SECURITY.md`](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/SECURITY.md)
- **Contributing** — [`docs/CONTRIBUTING.md`](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/CONTRIBUTING.md) · [Code of Conduct](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/CODE_OF_CONDUCT.md)

---

## Reference deployment

| | |
|:--|:--|
| **Chain** | Polygon PoS (137) |
| **Main registry** (v0.6) | [`0x012aC6393464A73EC16131D701ff2e000695b91b`](https://polygonscan.com/address/0x012aC6393464A73EC16131D701ff2e000695b91b) |

Satellite contracts and the superseded v0.5 registry are listed under
[Current Release](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/GUIDE.md#current-release).

---

## 🙋 We are looking for people — yes, you

The project is built in the open by **Andrei Chernikov** — a contemporary artist, entrepreneur and
family-history archivist — largely through AI-assisted development steered by product vision rather
than an engineering background. That is exactly why it needs **real people**: developers to review
and harden what exists, testers to break it, designers, translators, artists and collectors to try
it on actual objects, and skeptics to say where it is wrong.

You do not need to be a blockchain expert. If this page made you curious, there is a task for you.

**[→ Start in Discussions](https://github.com/object-digital-passport/object-digital-passport/discussions)**

---

<p align="center">
  <sub>MIT-licensed · Free to verify, forever · <a href="https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/SECURITY.md">Report a vulnerability</a></sub>
</p>
