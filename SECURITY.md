# ODP Security Model · v0.1

*Author: Andrei Chernikov*

Object Digital Passport is a **registry of claims**, not a guarantee of physical authenticity.
This document describes the threat model, known limitations, and recommendations.

---

## What the protocol guarantees

- A record exists in the blockchain at a specific timestamp
- The data at `dataUrl` matches the hash recorded at mint time
- The Creator ID is tied to a specific wallet address
- All hashes are immutable after minting
- No one — including the deployer — can delete or modify records

## What the protocol does NOT guarantee

- That the physical object exists
- That the creator is who they claim to be
- That an NFC chip is genuinely NTAG 424 DNA TagTamper
- That a P-type institution is legitimate
- That the person holding the wallet is the original artist

---

## Known risks and mitigations

### 1. Social engineering and phishing

**Risk:** Fake website mimicking ODP verifier. Fake "official" P-type institution.
Links in `dataUrl` or `noteUrl` pointing to malicious content.

**Mitigation:**
- The verifier computes SHA-256 of fetched content and compares to on-chain hash.
  Content substitution is detected automatically.
- Verifiers show only the Creator ID (P-NNN-NNN-NNN-NNN) — no institution name.
  Names are self-declared and not stored in the protocol.
- To trust a Proof, find the exact Creator ID on the institution's official website.
- Never click links from `noteUrl` without checking the domain.

---

### 2. Stolen creator wallet

**Risk:** Attacker with access to creator's wallet can call `updatePassportUrls`.
The `confirmedDataHash` parameter prevents accidental wrong URLs but does NOT
protect against a deliberate attacker who can read the public `dataHash` from
the blockchain.

**Mitigation:**
- Use a hardware wallet (seed-less preferred) for the creator key
- Store the deployer key offline — it is only needed for `freeze()`
- Rate limit on mints limits damage from a stolen wallet
- All existing passport records remain valid even if wallet is compromised —
  the attacker can only update URLs, not hashes

---

### 3. Multiple wallets (anti-spam, not anti-sybil)

**Risk:** The monthly mint limits (tiered by Creator type in the v0.2 reference contract: **C** ≈ 1k/month, **B** ≈ 100k/month, **P** unlimited) can be circumvented by creating
multiple wallets. This is an anti-spam measure, not a Sybil resistance mechanism.

**Accepted tradeoff:** The protocol is permissionless by design.
Off-chain whitelists (separate repositories) provide reputation layering
without compromising the trustless core.

---

### 4. Frontend supply chain (CDN)

**Risk:** Scripts loaded from CDN (e.g. ethers.js) could be tampered
with by a CDN compromise. A malicious script could intercept private keys or
manipulate transactions.

**Recommendation for production deployment:**
- Download and self-host all JavaScript dependencies
- Add Subresource Integrity (SRI) hashes to all `<script>` tags:

```html
<script
  src="ethers.min.js"
  integrity="sha384-[hash]"
  crossorigin="anonymous"
></script>
```

- Serve over HTTPS with HSTS enabled
- Consider a Content Security Policy (CSP) header

---

### 5. RPC privacy

**Risk:** Public RPC endpoints (polygon-rpc.com, rpc-amoy.polygon.technology)
log all requests including wallet addresses and queried data.

**Recommendation:**
- For sensitive use cases, run your own Polygon node
- Use a private RPC provider (Alchemy, Infura, Quicknode)
- For verification only (read), public RPC is generally acceptable

---

### 6. Canonical JSON and Unicode edge cases

**Risk:** If two implementations serialize `passport.json` differently,
the computed `dataHash` will differ and a legitimate passport will appear TAMPERED.

**Protocol requirement (see SPEC.md §9):**
All string values must be Unicode NFC normalized before hashing.
Keys must be sorted alphabetically at every nesting level.

```python
# Python
import unicodedata
value = unicodedata.normalize("NFC", value)
data  = json.dumps(obj, sort_keys=True, separators=(",",":"), ensure_ascii=False)
```

```javascript
// JavaScript
value = value.normalize("NFC")
data  = JSON.stringify(sortKeysDeep(normalizeNFC(obj)))
```

**Edge cases to watch:**
- Cyrillic, Arabic, CJK characters — always NFC normalize
- Emoji with variation selectors — normalize before storing
- File paths with Unicode — normalize before including in passport.json

---

### 7. NFC chip trust

**Risk:** The contract stores `nfcPublicKey` and `nfcModel` as declared by the creator.
It cannot verify that the physical chip is genuinely NTAG 424 DNA TagTamper or that
the public key matches the installed chip.

**Accepted limitation:** NFC hardware verification is physically impossible on-chain.
Cryptographic challenge-response verification must be performed by a compatible
mobile application at the time of physical inspection.

**Recommendation:** SDK implementations must perform challenge-response verification
(see SPEC.md §11, Level 2A) — showing only "NFC key on file" without challenge-response
is insufficient for high-value objects.

---

### 8. Numbered seal weakness

**Risk:** A numbered seal (sealType 2) provides reference, not cryptographic proof.
The number can be copied onto a fake object.

**Accepted limitation:** Numbered seals are appropriate for lower-value items where
physical inspection is feasible. For high-value art, NFC (sealType 1 or 3) is required.

---

## Deployer key security

The `deployer` address has one special power: calling `freeze()` to permanently
stop new writes (used when migrating to v1).

**Requirements:**
- Generate the deployer key on an air-gapped machine
- Store seed phrase offline, in at least two physical locations
- Use this wallet for nothing else — zero balance except gas for `freeze()`
- Consider a hardware wallet for the deployer key

If the deployer key is compromised:
- Attacker can freeze the contract (stop new writes)
- Attacker CANNOT delete or modify any existing records
- Attacker CANNOT steal funds (contract holds no significant value)

---

## Verifier checklist (for users)

When verifying an object:

- [ ] Human ID matches QR code exactly
- [ ] Status shows **AUTHENTIC** (data hash verified)
- [ ] Creator ID matches what is published on the creator's official website
- [ ] If Proof records exist — each P-type ID is findable on the institution's website
- [ ] For NFC seal — use a compatible app to run challenge-response verification
- [ ] For numbered seal — visually compare number on object to number in passport
- [ ] `dataUrl` domain looks legitimate (not a lookalike)
- [ ] If image is registered — drop the image file to verify hash

---

## Reporting security issues

Open an issue at:
[https://github.com/object-digital-passport/object-digital-passport/issues](https://github.com/object-digital-passport/object-digital-passport/issues)

For sensitive disclosures, contact via GitHub private security advisory.
