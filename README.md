# Object Digital Passport · v0.1

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/object-digital-passport/object-digital-passport?style=flat&logo=github)](https://github.com/object-digital-passport/object-digital-passport/stargazers)

**Try the live demo (GitHub Pages):** **[https://object-digital-passport.github.io/object-digital-passport/](https://object-digital-passport.github.io/object-digital-passport/)** — [Verify](https://object-digital-passport.github.io/object-digital-passport/verify.html) (no wallet) · [Creator ID](https://object-digital-passport.github.io/object-digital-passport/creator.html) · [Passport](https://object-digital-passport.github.io/object-digital-passport/passport.html)

*If **`/` works but `verify.html` / `creator.html` return 404**, the site is probably still built with **Jekyll from a branch** (only README), not the static files in **`web/`**. Fix: **Settings → Pages → Build and deployment → Source: GitHub Actions** (not “Deploy from a branch”). Then open **Actions**, run workflow **Deploy GitHub Pages**, wait for green. The workflow lives at [`.github/workflows/pages.yml`](.github/workflows/pages.yml) (same logic as [`deploy/github-pages-workflow.yml`](deploy/github-pages-workflow.yml)).*

---

## Current release

| | |
|:--|:--|
| **Version** | **v0.1** |
| **Git tag** | [`v0.1`](https://github.com/object-digital-passport/object-digital-passport/releases/tag/v0.1) |
| **Network** | Polygon PoS (chain ID 137) |
| **Contract** | [`0x380092fA9C708BF01a552247909CF5DeceFb469E`](https://polygonscan.com/address/0x380092fA9C708BF01a552247909CF5DeceFb469E) |

When you publish a release on GitHub, create tag **`v0.1`** on the commit that matches this deployment so the tag link above resolves.

---

**An open standard for authenticating physical and digital objects via blockchain.**

No platform. No subscription. No central authority.
Anyone can implement it. Anyone can verify it. Forever.

---

## This repository

What you see here is **one example** of how the protocol can be built: a reference web stack, a Solidity contract, and helper tooling — **authored by Andrei Chernikov** as the initial reference implementation. It is meant to demonstrate the ideas end-to-end — not to be the only “official” product. **The full normative specification** (ID formats, hashes, verification rules, and what any compatible implementation must do) lives in **[`SPEC.md`](SPEC.md)**. Threat model and security notes: **[`SECURITY.md`](SECURITY.md)**. Use those documents as the source of truth; this README is an overview.

---

## What it is

ODP lets you register any physical or digital object on the Polygon blockchain
and prove its authenticity — using a human-readable ID, a cryptographic hash,
and a physical seal.

```
ODP-2026-03-4829301     ← Human ID (on the label, packaging, website)
C-482-930-174          ← Creator ID (your permanent identity)
```

Anyone with a phone can scan the QR code and verify:
- Who made it
- When it was registered
- Whether the data has been tampered with
- Whether the physical seal is intact

---

## How it works

```
1. Register your Creator ID    (~$0.01, one time)
       ↓
2. Register your object        (~$0.01)
   → generates Human ID
   → stores data hash on-chain
       ↓
3. Print the verification label
   → QR code  odp://ODP-2026-03-4829301
   → Human ID
   → Creator ID
   → physical seal (NFC chip or numbered sticker)
       ↓
4. Anyone scans → verifier checks blockchain → authentic ✓
```

---

## Repository structure

```
/
├── SPEC.md                    ← Protocol specification (English)
├── SPEC_RU.md                 ← Specification in Russian
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
    ├── creator.html           ← Register Creator ID
    ├── passport.html          ← Mint passports
    └── verify.html            ← Verify passports
```

---

## Quick start

### 1. Get a wallet

Install [MetaMask](https://metamask.io). Create a wallet. Save your seed phrase.

### 2. POL for gas

Registering a Creator ID and minting passports **submit transactions on Polygon PoS**. Gas is paid in that chain’s native token (**POL**), so your wallet must have POL on **Polygon PoS** for those actions. Verifying on `verify.html` is read-only and does not need POL.

### 3. Deploy the contract (or use the official deployment)

The official contract address is published at: **[to be added after mainnet deploy]**

> **After deploying — paste the contract address into all three HTML files.**
>
> Open each file and find the `CFG` object at the top of the `<script>` section:
>
> **`web/creator.html`**, **`web/passport.html`**, **`web/verify.html`** — all three:
> ```javascript
> const CFG = {
>   amoy: {
>     ...
>     contract: "",  // ← paste Amoy testnet address here
>   },
>   polygon: {
>     ...
>     contract: "",  // ← paste Polygon mainnet address here
>   },
> };
> ```
> Until you paste the address, the UI will show "Contract not configured".

To deploy your own:
```bash
cd deploy
npm install
cp .env.example .env
# Add your private key to .env

npm run deploy:testnet    # Polygon Amoy testnet
npm run deploy:mainnet    # Polygon mainnet
```

### 4. Register your Creator ID

**Via web UI:**
Open `web/creator.html` in a browser with MetaMask installed.
Click "Connect Wallet" → registration screen appears autopolally.

**Via CLI:**
```bash
cd tools
pip install web3 qrcode[pil] pillow python-dotenv
python mint.py --register
```

Choose your type:
- `C` — Creator (individual artist, photographer, maker)
- `B` — Brand (company, studio, label)
- `P` — Proof Institution (museum, gallery, auction house)

You'll receive a permanent ID like `C-482-930-174`.

**Publish your ID publicly** — on your website, social media, and physical objects.
This is how people verify that a passport was made by you.

```
Short:  C-482-930-174
Full:   C-482-930-174 / Your Name / 0x742d35Cc...
```

### 5. Mint a passport

**Via web UI:**
Open `web/passport.html`, connect wallet, fill the form, click "Mint Passport".
The UI handles hashing and blockchain submission. MetaMask will ask you to confirm.
After minting: download `passport.json` and upload it to your `dataUrl`.

**Via CLI:**
```bash
python mint.py
```
Follow the interactive prompts. On completion:
- `passports/ODP-YYYY-MM-NNNNNNN.json` — upload this to your `dataUrl`
- Run `python mint.py --qr ODP-YYYY-MM-NNNNNNN` to generate QR

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

**Via web UI:**
Open `web/verify.html` in any browser.
Enter a Human ID or paste a `odp://` URI. No wallet needed.

**Direct link:**
```
verify.html?id=ODP-2026-03-4829301
```

---

## Physical seal

A seal is required for physical objects. It binds the digital passport
to the specific physical object.

### Option A — NFC crypto chip (recommended for art)

Use **NXP NTAG 424 DNA** or **NTAG 424 DNA TagTamper**.
The chip contains a private key locked in silicon — it cannot be copied.
Each scan produces a unique cryptographic signature.

- Cost: ~$0.50–3 per chip
- Buy: AliExpress, Mouser, Seritag
- Where to get chip data: use any NTAG 424 DNA-compatible NFC writer app

The TagTamper variant permanently records if the seal is removed.

### Option B — Numbered seal

Any physical seal with a unique printed number:
holographic sticker, wax seal, lead seal, tamper-evident label.

The number and description are recorded in the passport.
Anyone can visually verify the number on the object matches the passport.

- Cost: from $0.05 per piece
- Easy to source at any scale

### Verification label

Print a label for each object containing:
- QR code (`odp://ODP-YYYY-MM-NNNNNNN`)
- Human ID in text
- Creator ID in text
- Protocol mark (`ODP`)

The label must physically cover or retain the seal so that
removing the label damages the seal.

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
captures the manifest autopolally. No extra steps needed.

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

Reading is always free. No wallet or API key needed.

See `SPEC.md` section 13 for the full SDK interface specification.

---

## Network

| | |
|--|--|
| Network | Polygon PoS |
| Chain ID | 137 |
| Gas per mint | ~$0.01 |
| Testnet | Polygon Amoy (chain ID 80002) |
| Contract | [to be published] |

---

## Costs

| Action | Cost |
|--------|------|
| Register Creator ID | ~$0.01 (once) |
| Mint a passport | ~$0.01 |
| Submit a proof | ~$0.01 |
| Verify an object | Free |
| Read any data | Free |

---

## Specification

The full protocol specification is in [`SPEC.md`](SPEC.md).
It defines exactly how IDs are generated, how hashes are computed,
how verification works, and what any SDK must implement.

Any developer can build a compatible implementation from the spec alone,
without reading this code.

For threat model, known risks, and security recommendations
see [`SECURITY.md`](SECURITY.md).

---

## Roadmap

| | |
|--|--|
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
