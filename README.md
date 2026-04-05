# Object Digital Passport · v0.3 (draft protocol / tooling)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/object-digital-passport/object-digital-passport?style=flat&logo=github)](https://github.com/object-digital-passport/object-digital-passport/stargazers)

ODP is an open standard for registering physical or digital objects on blockchain and proving authenticity later.
No platform lock-in, no subscription, no central gatekeeper.

## Table of Contents

- [Start Here](#start-here)
- [Quick Start (5 minutes)](#quick-start-5-minutes)
- [How ODP Works](#how-odp-works)
- [Positioning](#positioning)
- [Live Demo](#live-demo)
- [Current Release](#current-release)
- [Terms You Need](#terms-you-need)
- [Security and Verification Model](#security-and-verification-model)
- [Costs and Network](#costs-and-network)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Author and License](#author-and-license)

## Start Here

If you are new:

1. **Wallet and self-custody.** Use a separate wallet for experimenting with ODP (not your main savings stack). Learn how your wallet works, back up your recovery phrase offline, and treat every site that asks to “connect” as potentially risky. Follow **your wallet vendor’s official documentation** (for example the [MetaMask Help Center](https://support.metamask.io/), [Rabby](https://rabby.io/), or your provider’s site). **No particular wallet brand is required** — any EIP-1193–compatible browser wallet may work. On **[Profile](https://object-digital-passport.github.io/object-digital-passport/creator.html)** and **[Passport](https://object-digital-passport.github.io/object-digital-passport/passport.html)** you can also connect via **[WalletConnect v2](https://docs.reown.com/)** (mobile wallets, QR); the reference UI uses Reown’s provider and the same on-chain flows. Configure a free Project ID in [`web/odp-wc-config.js`](web/odp-wc-config.js) if you self-host the pages (see [`RELEASE_v0.4.md`](RELEASE_v0.4.md)). **Reference testing** of the static pages has been done **primarily with MetaMask** and WalletConnect smoke checks; other wallets are expected to work but are less routinely exercised. On Polygon you pay for transactions in **POL** (network currency); there is **no ODP protocol fee** — see [Costs and Network](#costs-and-network).
2. Read this README for the practical overview.
3. Read [`SPEC.md`](SPEC.md) for the exact protocol rules.
4. [`RELEASE_v0.3.md`](RELEASE_v0.3.md) summarizes **v0.3 vs v0.2** (what changed). **Reference site & tooling since then:** [`RELEASE_v0.4.md`](RELEASE_v0.4.md) (WalletConnect, session restore, docs — on-chain line still **v0.3**). **Deploying your own registry and `NET.*`:** [`deploy/README.md`](deploy/README.md).

Translated version:

- Russian README: [`localization/ru/README.md`](localization/ru/README.md)

**0.x** means proof-of-concept: behaviour and deployments can change. Each contract address is its **own** registry; passport and profile records do **not** move between deployments by themselves. **This repository documents the reference v0.3 line** (on-chain generation **3**); a future stable **v1** may define migration or dual-read — see versioning notes in [`SPEC.md`](SPEC.md) and [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md).

## Quick Start (5 minutes)

### 1) Prepare wallet and network fees

- Use an **injected** EIP-1193 wallet (MetaMask, Rabby, Coinbase Wallet, Brave Wallet, etc.), **or** choose **WalletConnect** in the connect menu on Profile/Passport to sign from a mobile wallet (QR / app link). Same contracts and fees apply.
- Keep a small **POL** (Polygon’s native token) balance so writes can confirm.
- **Use a dedicated wallet for ODP** — not for long-term savings, DeFi, or trading (this limits impact if a dapp is malicious).

### 2) Register your profile

- Open [Profile](https://object-digital-passport.github.io/object-digital-passport/creator.html).
- Register once to receive your profile ID (`C-...`, `B-...`, `P-...`, `M-...`).

### 3) Issue a passport

- Open [Passport](https://object-digital-passport.github.io/object-digital-passport/passport.html).
- Complete the form and confirm the transaction on-chain.
- Download your **`.odpass`** bundle (`passport.json`, `manifest.json`, and any attached originals as defined in the spec).

### 4) Publish canonical data at `dataUrl` (optional but recommended)

- Serve over **HTTPS** the same bytes that were hashed into **`dataHash`**. You may publish **raw `passport.json`**, or the full **`.odpass`** ZIP (same layout as the download from Passport); verifiers accept both, and for the ZIP they read **`passport.json`** from inside the archive.
- After registration, do not change those bytes if you expect hash verification to keep matching.

### 5) Verify

- Open [Verify](https://object-digital-passport.github.io/object-digital-passport/verify.html).
- Enter a Passport ID, paste an `odp://...` link, or drop a **`.odpass`** file.

## How ODP Works

End-to-end flow:

1. **Profile** — the issuing party registers a profile on-chain and gets a stable **Profile ID**.
2. **Passport** — they record a passport: content hashes, optional URLs, and metadata anchored in the **v0.3** registry (and optional auxiliary commitments per spec).
3. **Share** — they distribute the **Passport ID** (`ODP-...`) and, when used, hosted bytes at **`dataUrl`** (raw **`passport.json`** or a **§15 `.odpass`** ZIP) so verifiers can fetch and check **`dataHash`**.
4. **Verify** — anyone recomputes hashes, reads **read-only** chain state, and checks the **`.odpass`** package (or hosted bytes) against what the registry stores. No wallet is required to verify.

**ID naming**

- Human-readable object id: **Passport ID** (`ODP-YYYY-MM-…`).
- In JSON: field **`passportId`**.
- In contract ABI / wire payloads: **`humanId`** (historic wire name).

## Positioning

ODP does **not** replace human expertise, institutional provenance work, or other standards. It is meant to complement them — for example **digital product passport (DPP)** programmes, **GS1** data, **IIIF** media delivery, and **C2PA** content credentials (see [`SPEC.md`](SPEC.md) §18 for narrative alignment). One design idea is a **verifiable registry**: verification can show which deployment and rules produced a record, alongside checks on file integrity.

**Spam and abuse:** requiring writes on-chain is partly a sketch for reducing noise in a shared index, but the right balance for a stable product is still open — expect this to evolve before a stable release.

**Interfaces:** this specification does **not** normatively define visual design for apps or sites; that can be revisited with the community toward stability.

## Live Demo

Base URL:

- [https://object-digital-passport.github.io/object-digital-passport/](https://object-digital-passport.github.io/object-digital-passport/)

Pages:

- Verify (no wallet): [verify.html](https://object-digital-passport.github.io/object-digital-passport/verify.html)
- Profile (wallet + network fees): [creator.html](https://object-digital-passport.github.io/object-digital-passport/creator.html)
- Passport (wallet + network fees): [passport.html](https://object-digital-passport.github.io/object-digital-passport/passport.html)

## Current Release

Reference deployment (**Polygon mainnet**, `chainId` 137) for this repo’s static UI defaults:

| Item | Value |
|:--|:--|
| Protocol line | **v0.3** (on-chain `CONTRACT_VERSION` / generation **3**) |
| Main registry `ObjectDigitalPassport` | [`0xadb65b2F25596be7A798640BE3Ecc23956198d39`](https://polygonscan.com/address/0xadb65b2F25596be7A798640BE3Ecc23956198d39) |
| Wallet document anchor `ODPWalletDocumentAnchor` (satellite) | [`0xA040E5e6e270b9e7303ce75421937e0D455F2eA5`](https://polygonscan.com/address/0xA040E5e6e270b9e7303ce75421937e0D455F2eA5) |

v0.3 vs v0.2: [`RELEASE_v0.3.md`](RELEASE_v0.3.md). Reference **site / docs** updates (WalletConnect, UI notes): [`RELEASE_v0.4.md`](RELEASE_v0.4.md).

## Terms You Need

| Term | Meaning in ODP |
|:--|:--|
| Register | One-time profile registration (`registerCreator`) |
| Issue / mint | Create a new passport record on-chain (user-facing “issue”; ABI may say *mint*) |
| Passport ID | Human-readable object id (`ODP-...`) |
| Profile ID | Issuer identity (`C/B/P/M-...`) |
| `passport.json` | Canonical off-chain object document |
| `dataUrl` | Optional HTTPS location for that JSON or **`.odpass`** bundle |
| Verify | Read-only checks (no wallet, no protocol fee) |

## Security and Verification Model

For threat model and trust boundaries:

- [`SECURITY.md`](SECURITY.md)

Verification basics:

- On-chain hashes are the anchor for what was registered.
- **`passport.json`** (or the bytes inside **`.odpass`**) must match the stored **`dataHash`** (and related fields per spec).
- **`manifest.json`** inside **`.odpass`** is packaging metadata for tools, not a separate trust root.

Normative rules:

- [`SPEC.md`](SPEC.md)

Deploy layout (EIP-170 split, library + satellite):

- [`docs/PROTOCOL_TRACKS.md`](docs/PROTOCOL_TRACKS.md)
- [`docs/EIP170_STRATEGY.md`](docs/EIP170_STRATEGY.md)

## Costs and Network

**Network**

- Polygon PoS (`chainId` 137)
- Testnet: Amoy (`chainId` 80002)

**Money**

- There is **no protocol fee** — you only pay **network fees** (often a small amount on Polygon for typical profile registration, passport issuance, and proof submission).
- Reading chain data and using **Verify** costs you nothing beyond your own internet access.

Exact fee amounts fluctuate with network load; there is no separate ODP markup.

## Roadmap

- **0.x:** expect iterative changes; gather feedback on the standard and tooling.
- **Stable target:** aim for a **stable v1-class release by January 2027**, shaped by community review (protocol text, security, UX, localization).

Pointers:

- [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md)
- [`docs/V0.3.md`](docs/V0.3.md)
- [`docs/V0.4.md`](docs/V0.4.md) · [`RELEASE_v0.4.md`](RELEASE_v0.4.md) (static site & documentation; protocol deployment unchanged)

## Contributing

- Guide: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Code of Conduct: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
- Docs index: [`docs/README.md`](docs/README.md)
- Russian: [`localization/ru/CONTRIBUTING.md`](localization/ru/CONTRIBUTING.md), [`localization/ru/CODE_OF_CONDUCT.md`](localization/ru/CODE_OF_CONDUCT.md), [`localization/ru/docs/README.md`](localization/ru/docs/README.md)

Contributions are welcome **across the whole project**: protocol and spec review, smart-contract and tooling work, UX and visual design, **editing and translation**, accessibility, and documentation. The goal is broad participation — not only code — so ODP can converge on a trustworthy, understandable standard by the **January 2027** stability milestone.

## Author and License

Author:

- Andrei Chernikov

License:

- [MIT](LICENSE)
