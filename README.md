# Object Digital Passport · v0.2

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/object-digital-passport/object-digital-passport?style=flat&logo=github)](https://github.com/object-digital-passport/object-digital-passport/stargazers)

## IMPORTANT: 0.X contracts are not long-term storage

In this repo we ship **0.X** deployments as proof-of-concept. During 0.X the **on-chain contracts may change** (including how creator registration works). Because **Creator IDs are assigned by the specific deployed contract**, you should assume that:

- You **can register and mint only inside that exact contract deployment**.
- Even with the same wallet address, a new deployment may generate a **different** `creatorId`.
- After a new 0.X deployment, you **won’t be able to “add” your old information into the new contract** (new registry = new creator registration / new records). The data you wrote remains available on-chain in the old registry, but it will not automatically carry over to the next deployment.
- If you want **only one wallet + one persistent `creatorId`** to be your main long-term storage, **please wait for the stable `v1`** and use that deployment for your canonical records.

## Terms (read this first)

Blockchain apps reuse words from NFTs and finance — here is what they mean **in ODP**:

| Term | Meaning here |
|:--|:--|
| **Mint / minting** | Sending a **transaction** that **creates** a new on-chain record. For a passport, **mint** means the smart contract **registers** your object: it assigns a **Human ID** and stores cryptographic **hashes** (v0.2: **network gas only** — no separate protocol fee). You still **download** and may **host** `passport.json` separately. |
| **Register (Creator ID)** | A **one-time** on-chain step: your wallet pays **gas** and receives a permanent **Creator ID** (`C-…`, `B-…`, or `P-…`). You must do this **before** you can mint passports. |
| **Passport** | The **whole record** for one object: the on-chain row **plus** (when published) the **passport.json** file at **`dataUrl`**. |
| **`passport.json`** | The **off-chain JSON document** with title, seal, hashes, etc. Only a **hash** of it lives on-chain; **you** must keep the file. If you register a **`dataUrl`**, publish the file there so verifiers can fetch it. |
| **`dataUrl`** | Optional **HTTPS** link where `passport.json` is hosted. If empty on-chain, the public Verify page **cannot** fetch JSON — only someone with the **file** can check details and authenticity. |
| **Verify / verification** | **Read-only** check: load chain data + (if available) `passport.json`, recompute hashes — **no** wallet or protocol fee. |
| **Gas** | **POL** paid to the **Polygon network** for executing transactions (varies with congestion). **v0.2** has **no** extra burned protocol fee on register/mint. |
| **Protocol fee** | **v0.1** deployments used a fixed **0.001 POL** burn on some actions. **v0.2** removes that — you pay **gas only** (POL). |
| **Wallet** | An Ethereum-compatible app that holds your keys and **signs** transactions. On desktop, the reference HTML talks to **injected** providers (see **Wallets (browser)** below), not only MetaMask. |

Normative definitions and formats: **[`SPEC.md`](SPEC.md)** (especially §1.1 and §2 onward).

### Wallets (browser)

The **Creator** and **Passport** pages use **`window.ethereum`** ([**EIP-1193**](https://eips.ethereum.org/EIPS/eip-1193)): any browser extension that injects this provider can connect and sign. Examples include **MetaMask**, **Rabby**, **Coinbase Wallet**, **Brave Wallet**, **OKX Wallet**, and other EIP-1193–compatible extensions. The helper in [`web/creator.html`](web/creator.html) / [`web/passport.html`](web/passport.html) (`injectedEthereum`) prefers MetaMask when multiple extensions expose `providers[]`; otherwise it uses the first injected provider.

**Out of scope in this repo:** **WalletConnect** (or similar) flows that do not inject `window.ethereum` are not wired in the static pages — they would need an explicit integration. On **mobile Safari** without an extension, use your wallet’s **in-app browser** or open the Pages URL from the wallet app so the same injected provider is available.

### Versioning (site vs contract)

| | |
|:--|:--|
| **Site / static release** | **`0.X.Y`** (see `ODP_SITE_VERSION` in [`web/odp-contract.js`](web/odp-contract.js)). Bump **Y** when you change only documentation, HTML/CSS, or tooling **without** a new contract deployment. |
| **Contract / protocol generation** | **`0.X`** in spec labels and git tags when bytecode or on-chain rules change (e.g. v0.1 → v0.2). The reference contract exposes **`SPEC_MAJOR`** / **`SPEC_MINOR`** (readable spec line) and a packed **`CONTRACT_VERSION`** byte for the UI. |
| **On-chain `CONTRACT_VERSION`** | **Not** marketing semver. The reference UI reads it to pick ABIs: **≥2** = spec **v0.2** (gas-only, optional `dataUrl`, folder-base mint, **external document hash**, **`M` (museum)** prefix, unlimited **P/M** mints, **`submitProof`** from **P or M**). **`CONTRACT_VERSION == 0`** (historical v0.1 fee-era deploys) is **rejected**. See [`web/odp-contract.js`](web/odp-contract.js). |
| **Packed byte** | **`SPEC_MAJOR`/`SPEC_MINOR`** each &lt; 16. **Spec 0.2** → `SPEC_MINOR=2` → **`CONTRACT_VERSION = 2`**. |
| **Older mainnet deploy** | The first public Polygon contract used on-chain byte **0** (fee-era). This repo’s **current HTML does not support that address** as `NET.contract`; use a **v0.2+** deployment. Historical discussion: **`SECURITY.md`**, **`SPEC.md`**. |

### Stack label & trust (always on in the web UI)

The pages under `web/` show a **stack panel** (see `odpFormatStackBlockHtml` in [`web/odp-contract.js`](web/odp-contract.js)) so operators never rely on hidden assumptions:

| Topic | What it means |
|:--|:--|
| **Reading older data** | The **read ABI** still decodes prior **`contractVersion`** values on-chain. The **verifier** calls the **primary** `NET.contract` first; if a passport or creator is **not** found there, it tries **`NET.previousContracts`** (older Polygon deployments — each is its own registry). |
| **Site SemVer — red** | **`0.x.y`** (`ODP_SITE_VERSION`) = **red flag**: proof-of-concept / not production-stable. |
| **Site SemVer — green** | **`1.0.0`** and up: **stable** line. The UI is **green** when this site’s **major** matches **`ODP_LATEST_STABLE_MAJOR`** (bump that constant when you ship a new stable major, e.g. `2` after `1.x`). |
| **Site SemVer — yellow** | If the latest stable **major** is **N ≥ 2**, **majors `1 … N−1`** are **yellow** (older stable lines — review migration). A site **major newer** than `ODP_LATEST_STABLE_MAJOR` is also **yellow** until you align the constant. |

**Canonical live URLs** (GitHub Pages project site): base **[https://object-digital-passport.github.io/object-digital-passport/](https://object-digital-passport.github.io/object-digital-passport/)** — e.g. [Creator ID](https://object-digital-passport.github.io/object-digital-passport/creator.html), [Passport](https://object-digital-passport.github.io/object-digital-passport/passport.html), [Verify](https://object-digital-passport.github.io/object-digital-passport/verify.html).

---

## What this system is (and why)

**Object Digital Passport (ODP)** is an open standard for registering a **physical or digital object** on a public blockchain and later **proving** that a given object matches that registration — without a proprietary platform, subscription, or central gatekeeper.

**How the pieces fit together:**

- **Human ID** (`ODP-YYYY-MM-NNNNNNN`) — a readable, unique handle for the object; minted by the contract, immutable.
- **Creator ID** (`C-482-930-174`, etc.) — a permanent identity for the artist, brand, or institution; required before minting.
- **On-chain record** — compact: hashes, creator binding, URLs, seal metadata. **No** large images or full JSON on-chain.
- **Passport JSON** — the full document should live at **`dataUrl`** when you want public web verification (HTTPS); the chain stores a hash so any change to the file is detected. **`dataUrl` may be omitted** at mint (v0.2), but then only people with the **file** can verify.

**Core principles** (from **`SPEC.md` §1**; normative wording there):

| Principle | Meaning |
|:--|:--|
| **Open** | Anyone may implement the protocol in any language or platform. |
| **Decentralized** | No single company controls the registry. |
| **Offline-friendly** | Authenticity can be verified without internet using only hashes (see **SPEC.md**). Typical browser verifiers also read the chain and `dataUrl` for a complete check. |
| **Free to read** | Verification never costs anything (chain reads use public RPCs). |
| **Minimal on-chain** | No images or large data stored on-chain — only what **`SPEC.md`** requires. |

**This repository** is **one reference example**: Solidity contract, static pages under `web/`, deploy scripts, and helpers — **authored by Andrei Chernikov**. It demonstrates the ideas end-to-end. **The normative rules** (ID formats, hashing, verification, seals) are in **[`SPEC.md`](SPEC.md)**; security discussion in **[`SECURITY.md`](SECURITY.md)**.

---

## Live demo (example UI)

The pages below are **example** front ends. Set **`NET.contract`** in `web/creator.html`, `web/passport.html`, and `web/verify.html` to your **v0.2+** deployment; the UI probes **`CONTRACT_VERSION()`** and **rejects** legacy byte **0** (see **Versioning** above). Protocol behavior is defined in **`SPEC.md`**, not by this HTML alone.

**GitHub Pages:** **[https://object-digital-passport.github.io/object-digital-passport/](https://object-digital-passport.github.io/object-digital-passport/)**

| Page | URL | Notes |
|:--|:--|:--|
| **Verify** | [verify.html](https://object-digital-passport.github.io/object-digital-passport/verify.html) | Read-only — **no wallet** |
| **Creator ID** | [creator.html](https://object-digital-passport.github.io/object-digital-passport/creator.html) | Needs wallet + gas |
| **Passport** | [passport.html](https://object-digital-passport.github.io/object-digital-passport/passport.html) | Needs wallet + gas |

*If the site root loads README-style content but `verify.html` returns 404, GitHub Pages may still be serving a branch/Jekyll build. Prefer **Settings → Pages → Source: GitHub Actions** and a green **Deploy GitHub Pages** run — see [`.github/workflows/pages.yml`](.github/workflows/pages.yml).*

**GitHub Pages — registry address:** The static HTML ships with `NET.contract: ""` in git. The Pages workflow injects your deployed Polygon address at build time from **`ODP_CONTRACT_ADDRESS`** (repository **secret** or **variable** — checksum `0x…` string; the workflow uses the secret if set, otherwise the variable). Add it under **Settings → Secrets and variables → Actions** (same value in all three pages). The workflow also writes **`registry-config.json`** next to the HTML; the UI fetches it with `cache: no-store` so the first visit after a deploy still picks up the address even if the browser cached an older HTML without `NET.contract`. If the secret is missing, set the address locally in `web/creator.html`, `web/passport.html`, and `web/verify.html`, or add `web/registry-config.json` with `{"contract":"0x…"}` for static hosting. **Quick local try:** open `creator.html` once as `…/creator.html?contract=0xYourPolygonAddress` — the UI stores it in **sessionStorage** for that tab (keyed by chain id) so you can drop the query on later loads during the same session.

---

## Current release

| | |
|:--|:--|
| **Recommended PoC line** | **v0.2** — see **[`RELEASE_v0.2.md`](RELEASE_v0.2.md)** for a friendly overview. It is the **most stable proof-of-concept** baseline in this repo right now (gas-only contract rules, optional `dataUrl`, updated UI). |
| **Historical v0.1-era deploy** | Polygon PoS — [`0x380092fA9C708BF01a552247909CF5DeceFb469E`](https://polygonscan.com/address/0x380092fA9C708BF01a552247909CF5DeceFb469E) (on-chain byte **0**). **Not** supported by this reference UI; listed for transparency only. Use a **v0.2+** contract for new work. |
| **Git / tags** | Not every iteration of the “0.1” idea was captured in a single tidy tag while the repo was still learning GitHub workflows — **v0.2** is the coherent snapshot we point people to. Older tags may exist for history; trust **`RELEASE_v0.2.md`** + `main` for the current PoC story. |

After you deploy **v0.2** to mainnet, add a **`v0.2`** (or similar) tag on the matching commit and paste the new address into the three `NET.contract` fields in `web/`.

---

**An open standard for authenticating physical and digital objects via blockchain.**

No platform. No subscription. No central authority.
Anyone can implement it. Anyone can verify it. Forever.

---

## This repository (scope)

What you see here is **one example** of how the protocol can be built — not the only permissible product. **`SPEC.md`** is the source of truth for compatible implementations; this README is an overview.

---

## What it is

ODP lets you register any physical or digital object on the Polygon blockchain
and prove its authenticity — using a human-readable ID, a cryptographic hash,
and (for physical objects) a physical seal.

```
ODP-2026-03-4829301     ← Human ID (on the label, packaging, website)
C-482-930-174          ← Creator ID (your permanent identity)
```

Anyone with a phone can scan the QR code and verify:

- Who made it
- When it was registered
- Whether the data has been tampered with
- Whether the physical seal is intact (per the chosen seal method)

---

## How it works

```
1. Register your Creator ID    (~US$0.02 typ., one time — gas + fee)
       ↓
2. Register your object        (~US$0.02 typ. — gas + fee)
   → generates Human ID
   → stores data hash on-chain
       ↓
3. Print the verification label
   → QR code  odp://ODP-2026-03-4829301
   → Human ID
   → Creator ID
   → physical seal (see below)
       ↓
4. Anyone scans → verifier checks blockchain → authentic ✓
```

---

## Repository structure

```
/
├── SPEC.md                    ← Protocol specification (English)
├── LICENSE                    ← MIT (copyright: Andrei Chernikov)
├── CONTRIBUTING.md            ← How to contribute; labels & PR flow
├── CODE_OF_CONDUCT.md         ← Contributor Covenant
├── docs/
│   └── VERSIONING_AND_RELEASES.md  ← Tags, main, freezing v0.1, hotfixes
├── .github/
│   ├── workflows/
│   │   └── pages.yml          ← GitHub Pages: deploy /web (enable “GitHub Actions” in Settings → Pages)
│   ├── ISSUE_TEMPLATE/        ← Bug, feature, spec discussion (+ config contact links)
│   ├── pull_request_template.md
│   ├── BRANCH_PROTECTION.md   ← Optional GitHub branch protection (enable later in Settings)
│   └── profile/
│       ├── README.md          ← Org landing page (copy to org repo `object-digital-passport/.github`)
│       └── PUBLISH.md         ← How to publish that README on GitHub
│
├── contracts/
│   └── ObjectDigitalPassport.sol   ← Solidity smart contract
│
├── deploy/
│   ├── package.json
│   ├── hardhat.config.js
│   └── scripts/
│       └── deploy.js
│
├── tools/
│   └── mint.py                ← CLI for minting (Python)
│
└── web/
    ├── .nojekyll              ← Ensures static upload is not processed as Jekyll when needed
    ├── creator.html           ← Register Creator ID (example UI)
    ├── passport.html          ← Mint passports (example UI)
    └── verify.html            ← Verify passports (example UI)
```

---

## Quick start (example web UI)

The following uses the **live demo** links above — **functional examples** on the **official v0.1 contract**.

### 1. Wallet

- **Desktop browser:** Any **EIP-1193** extension that injects **`window.ethereum`** can connect (see **Wallets (browser)** at the top of this README). **MetaMask** is a common choice; **Rabby**, **Coinbase Wallet**, **Brave Wallet**, and others work the same way when you click **Connect**.
- **Phone:** Install a wallet app (**MetaMask** or another that supports Polygon and in-app browsing). Open the demo in the wallet’s **in-app browser** so the page gets an injected provider — same idea as the desktop extension.

Create a wallet, back up your seed phrase, and add **Polygon PoS** if prompted.

### 2. POL for gas and fees

Registering a Creator ID and minting passports **submit transactions on Polygon PoS**. You pay **network gas** in **POL**, and each of those actions also burns a fixed **0.001 POL** protocol fee — in practice often **~US$0.02 total per transaction** (gas + fee; varies). The **Verify** page is read-only and does **not** need POL or a wallet. **Updating URLs** on-chain is **gas only** (no extra protocol fee).

### 3. Official contract

The **Current release** table lists the canonical **v0.1** deployment. The demo HTML is already configured for that address.

**Folder hosting (`passport.html`):** the file on your server must be named exactly **`<Human ID>.json`** (e.g. `ODP-2026-03-4829301.json`), and the registered `dataUrl` must be the **full HTTPS URL** to that file (e.g. `https://example.com/passport/ODP-2026-03-4829301.json`). The Solidity contract in this repository can resolve `folderBase + "/" + HumanID + ".json"` **inside the mint transaction** when redeployed (`dataUrlIsFolderBase`); the **current** public Polygon deployment still uses the older ABI, so the web UI keeps **`NET.supportsFolderBaseMint: false`** and performs a **second** transaction (`updatePassportUrls`) to replace the temporary mint URL — set **`supportsFolderBaseMint: true`** only after you deploy the updated contract and paste its address.

If you need a **separate** deployment (e.g. private test), use the **`deploy/`** stack and wire addresses per **`SPEC.md`** — that workflow is for operators and integrators, not required to try the public demo.

### 4. Register your Creator ID

**Example UI:** open **[Creator ID (live demo)](https://object-digital-passport.github.io/object-digital-passport/creator.html)** — **Connect Wallet**, then follow the registration flow.

Choose your type when registering:

- **`C`** — Creator (individual artist, photographer, maker)
- **`B`** — Brand (company, studio, label)
- **`P`** — Proof Institution (museum, gallery, auction house)

You receive a permanent ID like `C-482-930-174`.

**Publish your ID publicly** — on your website, social media, and physical objects. That is how others confirm a passport was issued by you.

```
Short:  C-482-930-174
Full:   C-482-930-174 / Your Name / 0x742d35Cc...
```

### 5. Mint a passport

**Example UI:** open **[Passport (live demo)](https://object-digital-passport.github.io/object-digital-passport/passport.html)**, connect wallet, complete the form, **Mint Passport**. After minting, download **`passport.json`** and host it at the **`dataUrl`** you used.

*(Optional: automation and CLI flows are described in **`tools/mint.py`** — not required for the browser demo.)*

#### Hosting `passport.json` on third-party sites

The verifier loads your `dataUrl` in the browser. The URL must:

- **HTTPS** — public endpoint.
- **Raw JSON** — the HTTP response body must be the passport bytes only (not an HTML GitHub page, not a login wall).
- **GitHub / Git forges** — use the **Raw** link (`raw.githubusercontent.com/...`), not the blob viewer.
- **CORS** — the host must allow cross-origin `GET` from the verifier page (many static hosts and GitHub Raw do).
- **Unchanged bytes** — upload the file from the mint download without edits.

If you need the Human ID in the URL path, mint with a stable URL first, upload the file, then use **Update hosting URLs** in the wallet UI (gas only — no second mint fee).

Full normative wording: **SPEC.md §9 — Hosting `dataUrl` (third-party sites)**.

### 6. Verify

**Example UI:** open **[Verify (live demo)](https://object-digital-passport.github.io/object-digital-passport/verify.html)** in any browser. Enter a Human ID or paste an `odp://` URI. **No wallet.**

**Direct link pattern:**

```
https://object-digital-passport.github.io/object-digital-passport/verify.html?id=ODP-2026-03-4829301
```

---

## Physical seal

A seal is required for **physical** objects: it binds the digital passport to the **specific** object in front of you.

### Numbered seal (simple, widely used)

Any tamper-evident seal with a **unique printed number** — holographic sticker, wax seal, lead seal, numbered label. Record the number and description in the passport; anyone can check the physical mark against the document.

- Rough cost: from ~$0.05 per piece depending on material
- Easy to source at many scales

This reference demo is built around straightforward workflows; **numbered seals** match most maker needs without extra hardware.

### NFC crypto seal (high assurance)

The **protocol** allows an optional **cryptographic NFC seal** (challenge–response with a chip-bound key). Requirements are strict (see **`SPEC.md` §6**): generic NFC stickers are **not** sufficient for that profile. Product choices and verification UX are **implementation details** — follow the spec if you implement that path.

### Verification label

Print a label for each object containing:

- QR code (`odp://ODP-YYYY-MM-NNNNNNN`)
- Human ID in text
- Creator ID in text
- Protocol mark (`ODP`)

The label must physically cover or retain the seal so that removing the label damages or disturbs the seal (see **`SPEC.md`** seal retention rules).

---

## Digital objects

For digital art, video, 3D models, and other digital files:

1. **Register before publishing** the original file
2. The SHA-256 hash of the original file is stored on-chain
3. Whoever registered the hash first is the author of record
4. After registration, publish only compressed or watermarked versions
5. The original file is your cryptographic proof of authorship

C2PA compatibility: if your file contains an embedded C2PA manifest
(from Photoshop, Lightroom, Leica camera, etc.), the file hash
captures the manifest automatically. No extra steps needed.

---

## Proof Institution

Museums, galleries, and experts can register as type `P`
and attach attestations to any passport:

```
ODP-2026-03-4829301
  └── Proof from P-029-384-751  Garage Museum    2031
  └── Proof from P-774-002-391  Sotheby's        2051
```

Registration is open — no approval required.
Institutions must publish their ID publicly so anyone can verify their identity.

---

## SDK

To build a verifier or integrate ODP into your application:

```javascript
// Minimal verification — read from blockchain
const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

const record   = await contract.getPassport("ODP-2026-03-4829301");
const creator  = await contract.getCreator(record.creatorId);
const proofIds = await contract.getProofsForPassport("ODP-2026-03-4829301");
```

Use the **Current release** contract address for `CONTRACT_ADDRESS` on Polygon PoS. Reading is free. No wallet or API key needed.

See `SPEC.md` section 13 for the full SDK interface specification.

---

## Network

| | |
|:--|:--|
| Network | Polygon PoS |
| Chain ID | 137 |
| Typical mint / register (gas only, v0.2) | ~US$0.01 (varies) |
| Testnet | Polygon Amoy (chain ID 80002) |
| Historical contract (v0.1-era) | [`0x3800…469E`](https://polygonscan.com/address/0x380092fA9C708BF01a552247909CF5DeceFb469E) — not supported by this UI. |
| Contract (v0.2+) | Set in `web/*.html` `NET.contract` after deploy (see `deploy/scripts/deploy.js`). |

---

## Costs

**v0.2+** (on-chain packed byte **≥ 2**): **register**, **mint**, and **proof** transactions pay **Polygon network gas** (POL) only — **no** separate burned protocol fee in this line.

Older **v0.1-era** deployments used a separate burned fee on some actions; this reference UI does not target those contracts.

| Action | Typical cost (v0.2) |
|--------|----------------|
| Register Creator ID | ~US$0.01 (once) — gas only |
| Mint a passport | ~US$0.01 — gas only |
| Submit a proof | ~US$0.01 — gas only |
| Update passport URLs only (`updatePassportUrls`) | Gas only |
| Verify an object | Free |
| Read any data | Free |

---

## Specification

The full protocol specification is in [`SPEC.md`](SPEC.md).
It defines exactly how IDs are generated, how hashes are computed,
how verification works, and what any SDK must implement.

Informal v0.2 design notes (not normative) live in [`docs/V0.2-DRAFT.md`](docs/V0.2-DRAFT.md).

Any developer can build a compatible implementation from the spec alone,
without reading this code.

For threat model, known risks, and security recommendations
see [`SECURITY.md`](SECURITY.md).

---

## Roadmap

| | |
|:--|:--|
| **Reference launch (v0.1)** | *Now* — draft specification, example stack in this repo, contract & web UI as a working illustration. |
| **Interim milestones** | *TBD* — ecosystem feedback, testnet/mainnet iterations, spec refinements (tracked via issues and PRs). |
| **Stable release v1.0** | **January 2027** — target for a stable protocol version and compatible **v1** tooling (see SPEC versioning rules). |

Until v1.0, breaking changes to the draft spec (0.x) are expected. Implementations should pin a spec version they support.

---

## Contributing

This is a draft specification (v0.1). Feedback is the goal.

- **[`CONTRIBUTING.md`](CONTRIBUTING.md)** — fork/PR flow, labels, scope
- **[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)** — Contributor Covenant (community expectations)
- **[`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md)** — tags vs `main`, freezing a version line (e.g. v0.1), hotfix tags
- **[`.github/BRANCH_PROTECTION.md`](.github/BRANCH_PROTECTION.md)** — optional GitHub branch rules (enable on GitHub when you are ready; not required for day-to-day work)
- **[`.github/profile/README.md`](.github/profile/README.md)** — text for the **organization** homepage; publish via a separate org repo **`.github`** — see **[`.github/profile/PUBLISH.md`](.github/profile/PUBLISH.md)**

Quick pointers:

- Open an issue to discuss changes to the spec
- Pull requests welcome for contract, tooling, and documentation
- To propose a new Creator ID type prefix, open a spec discussion first

---

## Author

**Object Digital Passport** (reference implementation, specification, contract, and web UI) was created by **Andrei Chernikov**.

---

## License

[MIT](LICENSE) — use freely, build on it, fork it.

---

*Object Digital Passport — open source.*
*Spec v0.1 — draft; stable **v1.0** targeted for January 2027 (see Roadmap).*
