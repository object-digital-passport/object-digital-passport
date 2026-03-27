# Object Digital Passport · v0.3 (draft protocol / tooling)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/object-digital-passport/object-digital-passport?style=flat&logo=github)](https://github.com/object-digital-passport/object-digital-passport/stargazers)

ODP is an open standard for registering physical or digital objects on blockchain and proving authenticity later.
No platform lock-in, no subscription, no central gatekeeper.

## Table of Contents

- [Start Here](#start-here)
- [Quick Start (5 minutes)](#quick-start-5-minutes)
- [How ODP Works](#how-odp-works)
- [Live Demo](#live-demo)
- [Current Release](#current-release)
- [Terms You Need](#terms-you-need)
- [Technical Notes](#technical-notes)
- [Repository Structure](#repository-structure)
- [Security and Verification Model](#security-and-verification-model)
- [Costs and Network](#costs-and-network)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Author and License](#author-and-license)

## Start Here

If you are new:

1. Read this README for the practical overview.
2. Read [`SPEC.md`](SPEC.md) for the exact protocol rules.
3. Use [`RELEASE_v0.3.md`](RELEASE_v0.3.md) for the current v0.3 operator snapshot. The older **v0.2** deployed line is summarized under [**Current release**](#current-release) below and in [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md).

Translated version:
- Russian README: [`localization/ru/README.md`](localization/ru/README.md)

Important context about version lines:
- `0.x` means proof-of-concept stage.
- Deployments are separate registries (address A is not address B).
- Profile/passport records do not auto-migrate between deployments.
- v0.1 and v0.2 are not backward-compatible registries.

## Quick Start (5 minutes)

### 1) Prepare wallet and gas

- Use an EIP-1193 wallet (MetaMask, Rabby, Coinbase Wallet, Brave Wallet, etc.).
- Keep a small POL balance for gas.
- **Use a dedicated wallet for ODP only** — not for savings, DeFi, or trading (limits damage if a dapp is malicious).

### 2) Register your profile

- Open [Profile](https://object-digital-passport.github.io/object-digital-passport/creator.html).
- Register once to receive your profile ID (`C-...`, `B-...`, `P-...`, `M-...`).

### 3) Mint a passport

- Open [Passport](https://object-digital-passport.github.io/object-digital-passport/passport.html).
- Fill form and mint.
- Download your `.odp` bundle (`passport.json` + `manifest.json` + optional files).

### 4) Publish `passport.json` (optional but recommended)

- Host raw JSON at your `dataUrl` (HTTPS).
- Do not edit bytes after mint if you want hash verification to pass.

### 5) Verify

- Open [Verify](https://object-digital-passport.github.io/object-digital-passport/verify.html).
- Enter Passport ID, paste `odp://...`, or drop `.odpass` / `.odp` file.

## How ODP Works

Simple mental model:

1. Register issuer profile on-chain.
2. Mint object passport on-chain (hashes + links + metadata).
3. Share Passport ID and optional hosted `passport.json`.
4. Anyone verifies by recomputing hashes and reading chain state.

ID naming:

- Human-readable concept: **Passport ID** (`ODP-YYYY-MM-NNNNNNNNN`).
- In JSON: field is **`passportId`**.
- In contract ABI/wire payloads: field name remains **`humanId`** (legacy wire name).

## Live Demo

Base URL:
- [https://object-digital-passport.github.io/object-digital-passport/](https://object-digital-passport.github.io/object-digital-passport/)

Pages:
- Verify (no wallet): [verify.html](https://object-digital-passport.github.io/object-digital-passport/verify.html)
- Profile (wallet + gas): [creator.html](https://object-digital-passport.github.io/object-digital-passport/creator.html)
- Passport (wallet + gas): [passport.html](https://object-digital-passport.github.io/object-digital-passport/passport.html)

## Current Release

| Item | Value |
|:--|:--|
| Recommended PoC line | **v0.3** (this repo) / **v0.2** (deployed mainnet below) |
| Mainnet contract (v0.2 line) | [`0x6c83c8C2e18c183a2776431a23187832b42FfFBb`](https://polygonscan.com/address/0x6c83c8C2e18c183a2776431a23187832b42FfFBb) — *v0.3 bytecode is in-repo; deploy a new address to use new ABI features* |
| Legacy contract (v0.1, unsupported by current UI) | [`0x380092fA9C708BF01a552247909CF5DeceFb469E`](https://polygonscan.com/address/0x380092fA9C708BF01a552247909CF5DeceFb469E) |

Operator-facing release notes:
- [`RELEASE_v0.3.md`](RELEASE_v0.3.md)

## Terms You Need

| Term | Meaning in ODP |
|:--|:--|
| Register | One-time profile registration (`registerCreator`) |
| Mint | Create new passport record on-chain |
| Passport ID | Human-readable object ID (`ODP-...`) |
| Profile ID | Issuer identity (`C/B/P/M-...`) |
| `passport.json` | Canonical off-chain object document |
| `dataUrl` | Optional HTTPS location of that JSON |
| Verify | Read-only checks (no wallet, no protocol fee) |

## Technical Notes

### Site version vs contract generation

- Site/doc patch changes: `ODP_SITE_VERSION` in [`web/odp-contract.js`](web/odp-contract.js).
- Protocol behavior compatibility: on-chain `CONTRACT_VERSION`.
- Current v0.2 line is `CONTRACT_VERSION = 2`.

### Compiler note

For this contract:
- `optimizer.enabled = true` (recommended `runs = 200`)
- `viaIR = true`

### Hosting pattern

Recommended naming:
- `https://host/path/<Passport ID>.json`

Where `<Passport ID>` is the same value as:
- JSON `passportId`
- ABI/wire `humanId` (legacy naming)

### Wallet support

Works with injected `window.ethereum` providers (EIP-1193).  
WalletConnect-style flows are not wired in static pages of this repo by default.

## Repository Structure

```
/
├── SPEC.md
├── SECURITY.md
├── RELEASE_v0.3.md
├── docs/
│   ├── README.md
│   ├── VERSIONING_AND_RELEASES.md
│   ├── V0.2-DRAFT.md
│   └── V0.3.md
├── e2e/
│   ├── README.md
│   ├── package.json
│   ├── playwright.config.cjs
│   └── smoke.spec.ts
├── contracts/
│   └── ObjectDigitalPassport.sol
├── deploy/
│   ├── hardhat.config.js
│   └── scripts/deploy.js
├── tools/
│   ├── mint.py
│   └── README.md
└── web/
    ├── creator.html
    ├── passport.html
    └── verify.html
```

## Security and Verification Model

For threat model and trust boundaries:
- [`SECURITY.md`](SECURITY.md)

Verification basics:
- On-chain hashes are source of truth.
- `passport.json` bytes must match `dataHash`.
- `.odp` `manifest.json` is UX metadata, not a trust anchor.

For exact normative rules:
- [`SPEC.md`](SPEC.md)

## Costs and Network

Network:
- Polygon PoS (`chainId = 137`)
- Testnet: Amoy (`chainId = 80002`)

Typical v0.2 costs:
- Register profile: ~US$0.01 (gas only)
- Mint passport: ~US$0.01 (gas only)
- Submit proof: ~US$0.01 (gas only)
- Verify/read: free

## Roadmap

- v0.2: current PoC baseline.
- 0.x line: changes are expected.
- v1.0: target stable line (see spec/versioning docs).

More details:
- [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md)
- [`docs/V0.3.md`](docs/V0.3.md)

## Contributing

- Guide: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Code of Conduct: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
- Docs index: [`docs/README.md`](docs/README.md)

Contributions are welcome for:
- protocol text,
- contract/tooling improvements,
- UI clarity and localization.

## Author and License

Author:
- Andrei Chernikov

License:
- [MIT](LICENSE)
