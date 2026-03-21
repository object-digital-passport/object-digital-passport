# Object Digital Passport

**An open standard for authenticating physical and digital objects via blockchain.**

No platform. No subscription. No central authority.
Anyone can implement it. Anyone can verify it. Forever.

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
    ├── create.html            ← Web UI for creating passports
    └── verify.html            ← Web UI for verifying passports
```

---

## Quick start

### 1. Get a wallet

Install [MetaMask](https://metamask.io). Create a wallet. Save your seed phrase.

### 2. Get POL for gas

You need a small amount of POL (~$0.10 covers ~10 transactions).

**Testnet (free):**
Go to [faucet.polygon.technology](https://faucet.polygon.technology),
paste your wallet address, receive free test POL.

**Mainnet:**
Buy POL on any exchange (Binance, Coinbase, Bybit) and send to your wallet address.
No identity verification required for small amounts via P2P or crypto ATMs.

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
Open `web/create.html` in a browser with MetaMask installed.
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
Open `web/create.html`, connect wallet, fill the form, click "Mint Passport".
The UI handles hashing and blockchain submission. MetaMask will ask you to confirm.
After minting: download `passport.json` and upload it to your `dataUrl`.

**Via CLI:**
```bash
python mint.py
```
Follow the interactive prompts. On completion:
- `passports/ODP-YYYY-MM-NNNNNNN.json` — upload this to your `dataUrl`
- Run `python mint.py --qr ODP-YYYY-MM-NNNNNNN` to generate QR

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

## Contributing

This is a draft specification (v0.1). Feedback is the goal.

- Open an issue to discuss changes to the spec
- Pull requests welcome for contract, tooling, and documentation
- To propose a new Creator ID type prefix, open a spec discussion first

---

## License

MIT — use freely, build on it, fork it.

---

*Object Digital Passport — open source.*
*Spec v0.1 — subject to change before stable release.*
