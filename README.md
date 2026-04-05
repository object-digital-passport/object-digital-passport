Object Digital Passport · v0.4 (draft protocol / tooling)

[License: MIT](LICENSE)
[GitHub stars](https://github.com/object-digital-passport/object-digital-passport/stargazers)

**Object Digital Passport (ODP)** is an **open standard for object authenticity**. It can describe **almost anything** — physical items, digital works, collectibles, and more: the standard is not tied to one industry.   

**It is built on a blockchain.** And no: this is not “another NFT project” or a meme coin. In plain terms, a **blockchain** is a chain of **information blocks** linked so the network can verify the chain is intact; a record that lands in a public registry **cannot be erased retroactively** as if it never existed — that is what makes later checks meaningful. The registry itself is still **not locked** to one company, subscription, or private gatekeeper for the index.

You **do not** need deep blockchain expertise to try the **[live demo pages](#live-demo)**. Checking a passport is free and does not require a wallet. Issuing a profile or passport uses common browser wallets and a small network fee on Polygon (often on the order of **~US$0.01** per typical transaction—network load varies) — details are in [Start Here](#start-here) and [Quick Start](#quick-start-5-minutes).

**What is this website?** [GitHub](https://github.com/) is where we host the **open-source** specification, web pages, and tools. You can read everything for free, copy the project, or suggest improvements — no account is required just to read.

## Languages and translations


|                            |                                                        |
| -------------------------- | ------------------------------------------------------ |
| 🇬🇧 **English**           | You are reading the main README.                       |
| 🇷🇺 **Russian / Русский** | [localization/ru/README.md](localization/ru/README.md) |


**We welcome README and UI translations in any language.** Add files under `localization/<language-code>/` (see the `[localization/ru/](localization/ru/)` layout). Open a **[Pull Request](https://github.com/object-digital-passport/object-digital-passport/pulls)** or an **[Issue](https://github.com/object-digital-passport/object-digital-passport/issues)** — maintainers will review. Guidelines: **[CONTRIBUTING.md](CONTRIBUTING.md)** (editing, localization, and how to propose changes).

**Help us:** translate, share the **[project link](https://github.com/object-digital-passport/object-digital-passport)**, or tell communities who might care about open provenance for objects.

## Table of contents

**Getting started**

- [Start Here](#start-here)
- [Quick Start (5 minutes)](#quick-start-5-minutes)
- [How ODP Works](#how-odp-works)
- [Positioning](#positioning)
- [Live Demo](#live-demo)

**Technical reference**

- [Reference stack v0.4 (quick facts)](#reference-stack-v04-quick-facts)
- [Current Release](#current-release)
- [Terms You Need](#terms-you-need)
- [Security and Verification Model](#security-and-verification-model)
- [Costs and Network](#costs-and-network)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Author and License](#author-and-license)

## Start Here

If you are new, follow this order:

1. **Wallet.** You need a crypto wallet (browser extension or app) to write to the network. Use a **separate** wallet for experiments—not the one that holds your main savings. Save your recovery phrase and store it offline. When a site asks to “connect”, pause: that is normal for these pages, but scammers use the same trick—read **your** wallet’s help, e.g. [MetaMask](https://support.metamask.io/) or [Rabby](https://rabby.io/) (brand is not important). On **[Profile](https://object-digital-passport.github.io/object-digital-passport/creator.html)** and **[Passport](https://object-digital-passport.github.io/object-digital-passport/passport.html)** you can also sign from a phone via QR. You pay a small **network fee** (on Polygon that is usually **POL**); there is **no separate ODP protocol fee**—see [Costs and Network](#costs-and-network). If you **self-host** a copy of the site, you may need extra settings—see [`web/odp-wc-config.js`](web/odp-wc-config.js) and [RELEASE_v0.4.md](RELEASE_v0.4.md).

2. **This README.** Read it through for a practical “how to use” picture—no code required.

3. **Rules in full.** The normative protocol text is [SPEC.md](SPEC.md).

4. **Going deeper.** What is new in this line: [RELEASE_v0.4.md](RELEASE_v0.4.md). Earlier changes vs older lines: [RELEASE_v0.3.md](RELEASE_v0.3.md). To **deploy your own** registry (for developers): [deploy/README.md](deploy/README.md).

**Still early days.** ODP is in **development, testing, and gathering feedback**—rules and deployments can still change. We aim for a **stable 1.x release around January 2027** as the long-term baseline. If you need a **record meant to last many years** with minimal rule churn, **consider waiting for that stable release**. Each contract address is its **own** registry; records do **not** move between deployments by themselves. More on versioning: [docs/VERSIONING_AND_RELEASES.md](docs/VERSIONING_AND_RELEASES.md).

## Quick Start (5 minutes)

### 1) Prepare wallet and network fees

- A browser wallet (**MetaMask**, **Rabby**, Coinbase Wallet, Brave, etc.) **or** connect from your phone using the menu on Profile/Passport (QR / app link).
- Keep a small **POL** balance—Polygon’s native token used for network fees.
- **Use a dedicated wallet for ODP**—not for long-term savings or trading (less risk if a site is malicious).

### 2) Register your profile

- Open [Profile](https://object-digital-passport.github.io/object-digital-passport/creator.html).
- Register once to receive your profile ID (`C-...`, `B-...`, `P-...`, `M-...`).

### 3) Issue a passport

- Open [Passport](https://object-digital-passport.github.io/object-digital-passport/passport.html).
- Complete the form and confirm the transaction on-chain.
- Download your `**.odpass`** bundle (`passport.json`, `manifest.json`, and any attached originals as defined in the spec).

### 4) Publish canonical data at `dataUrl` (optional but recommended)

- Serve over **HTTPS** the same bytes that were hashed into `**dataHash`**. You may publish **raw `passport.json`**, or the full `**.odpass**` ZIP (same layout as the download from Passport); verifiers accept both, and for the ZIP they read `**passport.json**` from inside the archive.
- After registration, do not change those bytes if you expect hash verification to keep matching.

### 5) Verify

- Open [Verify](https://object-digital-passport.github.io/object-digital-passport/verify.html).
- Enter a Passport ID, paste an `odp://...` link, or drop a `**.odpass**` file.

## How ODP Works

End-to-end flow:

1. **Profile** — the issuing party registers a profile on-chain and gets a stable **Profile ID**.
2. **Passport** — they record a passport: content hashes, optional URLs, and metadata anchored in an **ODP registry** (e.g. **v0.4** / **v0.3**-shaped `ObjectDigitalPassport` deployment, plus optional auxiliary commitments per spec).
3. **Share** — they distribute the **Passport ID** (`ODP-...`) and, when used, hosted bytes at `**dataUrl`** (raw `**passport.json`** or a **§15 `.odpass`** ZIP) so verifiers can fetch and check `**dataHash**`.
4. **Verify** — anyone recomputes hashes, reads **read-only** chain state, and checks the `**.odpass`** package (or hosted bytes) against what the registry stores. No wallet is required to verify.

**ID naming**

- Human-readable object id: **Passport ID** (`ODP-YYYY-MM-…`).
- In JSON: field `**passportId`**.
- In contract ABI / wire payloads: `**humanId`** (historic wire name).

## Positioning

ODP does **not** replace human expertise, institutional provenance work, or other standards. It is meant to complement them — for example **digital product passport (DPP)** programmes, **GS1** data, **IIIF** media delivery, and **C2PA** content credentials (see `[SPEC.md](SPEC.md)` §18 for narrative alignment). One design idea is a **verifiable registry**: verification can show which deployment and rules produced a record, alongside checks on file integrity.

**Spam and abuse:** requiring writes on-chain is partly a sketch for reducing noise in a shared index, but the right balance for a stable product is still open — expect this to evolve before a stable release.

**Interfaces:** this specification does **not** normatively define visual design for apps or sites; that can be revisited with the community toward stability.

## Live Demo

Base URL:

- [https://object-digital-passport.github.io/object-digital-passport/](https://object-digital-passport.github.io/object-digital-passport/)

Pages:

- Verify (no wallet): [verify.html](https://object-digital-passport.github.io/object-digital-passport/verify.html)
- Profile (wallet + network fees): [creator.html](https://object-digital-passport.github.io/object-digital-passport/creator.html)
- Passport (wallet + network fees): [passport.html](https://object-digital-passport.github.io/object-digital-passport/passport.html)

## Reference stack v0.4 (quick facts)

**This repository (`main`)** is the reference **v0.4** line: on-chain generation **4** when you deploy Solidity from here (`CONTRACT_VERSION` packed byte **4**), optional `**ODPCounterfeitConcern`** satellite, WalletConnect on static pages, and the slimmer main-registry ABI — see `**[RELEASE_v0.4.md](RELEASE_v0.4.md)`** and `**[SPEC.md](SPEC.md)`**. **Default Polygon addresses** in this README and `[deploy/deployments/polygon.json](deploy/deployments/polygon.json)` match the **generation 4** deployment baked into the static pages’ `NET.*`; if you self-host, align **chain + contract address + ABI** with your deployment.


|                         |                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Source**              | `**main`** in this repository — reference **v0.4** stack (contracts + static web).                                                                                                                                             |
| **On-chain generation** | `**CONTRACT_VERSION` = 4** (same v0.3-shaped `Passport` tuple as generation **3**).                                                                                                                                            |
| **New vs v0.3 line**    | Optional `**ODPCounterfeitConcern`** satellite (P/M concern); public `**SPEC_*` / `MONTHLY_LIMIT_*`** getters removed from the main contract bytecode for **EIP-170** headroom — see `**[RELEASE_v0.4.md](RELEASE_v0.4.md)`**. |
| **Deploy order**        | `**ODPPassportLib`** → `**ObjectDigitalPassport`** → optional `**ODPWalletDocumentAnchor`** / `**ODPCounterfeitConcern**` — `**[deploy/README.md](deploy/README.md)**`.                                                        |


## Current Release

Reference deployment (**Polygon mainnet**, `chainId` 137) for this repo’s static UI defaults:


| Item                                                           | Value                                                                                                                        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Protocol line                                                  | **v0.4** — on-chain generation **4** (`CONTRACT_VERSION` packed byte **4**; same `Passport` tuple shape as generation **3**) |
| Main registry `ObjectDigitalPassport`                          | `[0xBf3398E16aF6Ae7ab41524bee3570Fa36C219e75](https://polygonscan.com/address/0xBf3398E16aF6Ae7ab41524bee3570Fa36C219e75)`   |
| Linked library `ODPPassportLib` (verification / bytecode link) | `[0x9D7F483Fc94950F9cc825a8b9aD9BFCbb9a39d29](https://polygonscan.com/address/0x9D7F483Fc94950F9cc825a8b9aD9BFCbb9a39d29)`   |
| Wallet document anchor `ODPWalletDocumentAnchor` (satellite)   | `[0x1563f96355005FA90b383546D97CAEAc6F836A63](https://polygonscan.com/address/0x1563f96355005FA90b383546D97CAEAc6F836A63)`   |
| Counterfeit concern `ODPCounterfeitConcern` (satellite)        | `[0xE3B6f37901EC751f09b8EA4d839DC1F3ec311D4e](https://polygonscan.com/address/0xE3B6f37901EC751f09b8EA4d839DC1F3ec311D4e)`   |


**Release notes:** `[RELEASE_v0.4.md](RELEASE_v0.4.md)` · **Earlier line (v0.3 vs v0.2):** `[RELEASE_v0.3.md](RELEASE_v0.3.md)`.

## Terms You Need


| Term            | Meaning in ODP                                                                  |
| --------------- | ------------------------------------------------------------------------------- |
| Register        | One-time profile registration (`registerCreator`)                               |
| Issue / mint    | Create a new passport record on-chain (user-facing “issue”; ABI may say *mint*) |
| Passport ID     | Human-readable object id (`ODP-...`)                                            |
| Profile ID      | Issuer identity (`C/B/P/M-...`)                                                 |
| `passport.json` | Canonical off-chain object document                                             |
| `dataUrl`       | Optional HTTPS location for that JSON or `**.odpass`** bundle                   |
| Verify          | Read-only checks (no wallet, no protocol fee)                                   |


## Security and Verification Model

For threat model and trust boundaries:

- `[SECURITY.md](SECURITY.md)`

Verification basics:

- On-chain hashes are the anchor for what was registered.
- `**passport.json`** (or the bytes inside `**.odpass`**) must match the stored `**dataHash**` (and related fields per spec).
- `**manifest.json**` inside `**.odpass**` is packaging metadata for tools, not a separate trust root.

Normative rules:

- `[SPEC.md](SPEC.md)`

Deploy layout (EIP-170 split, library + satellite):

- `[docs/PROTOCOL_TRACKS.md](docs/PROTOCOL_TRACKS.md)`
- `[docs/EIP170_STRATEGY.md](docs/EIP170_STRATEGY.md)`

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

- `[docs/VERSIONING_AND_RELEASES.md](docs/VERSIONING_AND_RELEASES.md)`
- `[docs/V0.3.md](docs/V0.3.md)`
- `[docs/V0.4.md](docs/V0.4.md)` · `[RELEASE_v0.4.md](RELEASE_v0.4.md)` (on-chain v0.4 + site; default Polygon addresses match `[deploy/deployments/polygon.json](deploy/deployments/polygon.json)`)

## Contributing

- Guide: `[CONTRIBUTING.md](CONTRIBUTING.md)`
- Code of Conduct: `[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)`
- Docs index: `[docs/README.md](docs/README.md)`
- Russian: `[localization/ru/CONTRIBUTING.md](localization/ru/CONTRIBUTING.md)`, `[localization/ru/CODE_OF_CONDUCT.md](localization/ru/CODE_OF_CONDUCT.md)`, `[localization/ru/docs/README.md](localization/ru/docs/README.md)`

Contributions are welcome **across the whole project**: protocol and spec review, smart-contract and tooling work, UX and visual design, **editing and translation**, accessibility, and documentation. The goal is broad participation — not only code — so ODP can converge on a trustworthy, understandable standard by the **January 2027** stability milestone.

## Author and License

Author:

- Andrei Chernikov

License:

- [MIT](LICENSE)