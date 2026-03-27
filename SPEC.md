# Object Digital Passport
### Specification v0.2 — DRAFT

*Author: Andrei Chernikov*

> An open standard for physical and digital object authentication
> via blockchain and human-readable identifiers.

## IMPORTANT: v0.X is not backward-compatible storage

This repository documents a **v0.X** protocol line. During **0.X**, contract rules may still change.

In plain terms:
- A **deployment** means one specific contract address (one registry instance).
- Your `creatorId` and passport records belong to that specific deployment.
- If a new 0.X deployment is launched, even the same wallet may get a **different** `creatorId`.
- Data already written to an older deployment remains there and stays readable, but it does not move automatically into a newer deployment.
- **No backward compatibility with v0.1** for profile IDs (`creatorId`) or passport records: treat v0.1 and v0.2 as separate registries.

If your goal is **one wallet + one long-lived `creatorId`** as canonical storage, wait for stable **v1**.

---
## Translated versions (informational)

Localized specifications:
- [`localization/ru/SPEC.md`](localization/ru/SPEC.md)

**Warning (normative source):** `SPEC.md` in English is the only normative specification in this repository. Translations are provided for convenience and can contain mistakes; treat them as **informational only**.

---

## 1. Overview

Object Digital Passport (ODP) is an open standard that allows anyone to register a
physical or digital object on a public blockchain and verify its authenticity — without
any centralized platform, subscription, or third-party dependency.

**Core principles:**

- **Open** — anyone can implement the protocol in any language or platform
- **Decentralized** — no single company controls the registry
- **Offline-friendly** — authenticity can be verified without internet using only hashes
- **Free to read** — verification never costs anything
- **Minimal on-chain** — no images or large data stored on blockchain

### 1.1 Terminology

This specification uses the following terms in a precise sense:

| Term | Definition |
|:--|:--|
| **Passport ID** | The `ODP-…` object identifier (§2). The same string is stored in `passport.json` and in contract interfaces under the field / parameter name **`humanId`** (historical name; same value). |
| **Profile ID** | The issuer’s `C-…` / `B-…` / `P-…` / `M-…` identifier (§3). In `passport.json` it appears as **`creator.creatorId`**; on-chain event and function payloads use the string **`creatorId`**. |
| **Mint**, **minting** | Submitting an Ethereum transaction that **creates** a new on-chain passport record via the contract’s `mintPhysical` or `mintDigital` (or equivalent). The contract assigns the **Passport ID**, records **hashes**, optional **URLs**, and seal metadata. **v0.2** charges **network gas only** (no separate **MINT_FEE**). Minting does **not** upload `passport.json` to the blockchain; the creator **may** host that file at `dataUrl` (see §8–§9). If `dataUrl` is empty, public web verification cannot fetch JSON — only a holder of the canonical **passport.json** can verify against `dataHash`. |
| **Register (`registerCreator`)** | Submitting `registerCreator` (or equivalent) so the wallet receives a permanent **profile ID** before any mint or proof. **v0.2**: gas only (no **REGISTER_FEE**). |
| **Deployment** | One specific smart-contract instance at one address (one registry). Profile IDs and passport records are tied to that deployment. |
| **Passport** | The on-chain **Passport** record plus, when applicable, **passport.json** bytes matching `dataHash` (at `dataUrl` if set). |
| **`passport.json`** | The normative off-chain JSON document (§9). |
| **`dataUrl`** | Optional HTTPS URL where `passport.json` is served (§8–§9). May be empty on-chain in **v0.2**; if empty, verifiers relying on HTTP **cannot** obtain the file unless the user provides it. |
| **Gas** | Native-token cost (POL on Polygon PoS) paid to the network for transaction execution. **v0.2** has no additional burned protocol fee on register/mint (unlike **v0.1** deployments). |
| **Verification** | The read-only process (§11) that retrieves on-chain data and, when `dataUrl` is set, `passport.json`, and checks consistency with `dataHash` and other fields. If `dataUrl` is empty, file-based verification still applies when the verifier has `passport.json`. |

---

## 2. Passport ID

Every registered object receives a globally unique Passport ID (human-readable `ODP-…` string).

> **Wire names:** in Solidity, JSON-RPC ABIs, and `passport.json`, this value is labeled **`humanId`**. *Passport ID* is the specification’s name for the same string.

### Format

```
ODP-YYYY-MM-NNNNNNNNN
```

| Part | Description | Example |
|------|-------------|---------|
| `ODP` | Protocol prefix, fixed | `ODP` |
| `YYYY` | Year of registration (any year > 0) | `2026` |
| `MM` | Month of registration (01–12) | `03` |
| `NNNNNNNNN` | 9-digit random number, unique within the year and month | `004829301` |

### Examples

```
ODP-2026-03-004829301   ← object registered in March 2026
ODP-2026-03-000193847   ← another object in the same month
ODP-2026-04-007392018   ← object registered in April 2026
ODP-2027-01-002048391   ← object registered in January 2027
```

The number does not indicate the order or total count of registered objects.
This is intentional.

### Generation algorithm

```
entropy = keccak256(block.timestamp + msg.sender + nonce)
number  = uint32(entropy) % 1_000_000_000      // 000000000–999999999
if number already exists for this year+month:
    nonce++, retry
humanId = "ODP-" + year + "-" + month + "-" + zero_pad(number, 9)
```

10 million possible values per month. Uniqueness is guaranteed by the contract
through collision checking with autopol retry.

### Rules

- The number is generated by the contract — the creator does not choose it
- The number is unique within a year+month combination
- Two simultaneous mint transactions are ordered by the blockchain — duplicates are impossible
- Passport ID is immutable after minting
- Passport ID is the canonical identifier for all lookups

---

## 3. Profile ID

Every creator, brand, or institution must register on-chain before minting a passport
or submitting a proof. Registration assigns a permanent globally unique profile ID.

> **Wire names:** the short identifier is carried as string **`creatorId`** in contract payloads and as **`creator.creatorId`** inside `passport.json`.

**A registered profile ID is mandatory.** The contract rejects any mint or proof transaction
from an unregistered wallet.

### Format

```
T-NNN-NNN-NNN
```

| Part | Description | Example |
|------|-------------|---------|
| `T` | Type prefix (see below) | `C` |
| `NNN-NNN-NNN` | 9-digit random number split into groups of 3 for readability | `482-930-174` |

### Type prefixes

| Prefix | Meaning | Who uses it |
|--------|---------|-------------|
| `C` | Creator | Individual artist, photographer, maker |
| `B` | Brand | Company, studio, label |
| `P` | Proof Institution | Expert, auction house, certification body — attestations (`submitProof`) on any passport |
| `M` | Museum | Registered museum or collection — **unlimited** passport mints for institutional holdings (e.g. works by deceased artists); may also `submitProof` like `P` |

### Monthly mint caps (reference v0.2 contract)

The reference `ObjectDigitalPassport` deployment limits **new passport mints** per wallet, per **calendar month** (anti-spam; gas only — no protocol fee). Caps depend on the registered **Creator type**:

| Type | Approximate cap |
|------|-----------------|
| `C` | 1,000 mints / month |
| `B` | 100,000 mints / month |
| `P` | No limit (`getRemainingMints` returns `2^32−1` in the reference implementation) |
| `M` | No limit (same as `P`) |

**Museums and large inventories** digitizing collection holdings should register as **`M`** (museum/collection), **not `B` and not `C`**. The **`P`** prefix is for institutions whose **primary** role in the protocol is cross-cutting **proof** attestations; **`M`** signals custodial / collection issuance. Very large throughput may still use **multiple wallets** if policy allows.

**Type prefixes are governed exclusively by this specification.**
No individual, company, or implementation may introduce custom prefixes.
New prefixes are added only through an official update to this specification,
at which point the smart contract is redeployed with the updated allowlist.
The contract enforces this — any registration attempt with an unrecognized
prefix is rejected at the contract level.

### Examples

```
C-482-930-174-005   ← individual creator
B-029-384-751-224   ← brand or company
P-001-293-847-119   ← proof institution
M-204-839-112-441   ← museum or collection
```

### Generation algorithm

```
entropy  = keccak256(block.timestamp + msg.sender + nonce)
number   = uint64(entropy) % 1_000_000_000_000 // 000000000000–999999999999
if number already exists: nonce++, retry
group_1  = number / 1_000_000_000              // 1st 3 digits
group_2  = (number / 1_000_000) % 1_000        // 2nd 3 digits
group_3  = (number / 1_000) % 1_000            // 3rd 3 digits
group_4  = number % 1_000                      // 4th 3 digits
creatorId = type + "-" + pad3(group_1) + "-" + pad3(group_2) + "-" + pad3(group_3) + "-" + pad3(group_4)
```

1 trillion possible values. Uniqueness guaranteed by the contract.

### Full public identity

Every participant has two identity formats:

```
Short:  C-482-930-174-005
Full:   C-482-930-174-005 / Artist Name / 0x742d...f2c8
```

The full identity includes:
- Short profile ID (**required**)
- Full wallet address (0x... — 42 characters, **required**)
- Name or organization name (**optional**)

The full wallet address is the cryptographic anchor of identity and uniqueness.
The name is only a human-readable label. The wallet address is the unforgeable proof.

### Public identity requirement

**All participants — creators (C), brands (B), and institutions (P) —
must publish the short profile ID together with the full wallet address publicly.**

This is a fundamental requirement of the protocol, not merely a recommendation.
The system works only when anyone can verify who stands behind every object
and every attestation.

Participants should publish their identity transparently, with priority on places a regular user checks first:

- On their official website — prominently, not buried in menus
- In public social media profiles and bios
- On physical objects, packaging, and certificates when applicable
- In any other public channels they control where verification context is expected

**Both formats must be easy to find:**

```
Artist on artist.com:
  Short:  C-482-930-174-005
  Full:   C-482-930-174-005 / Artist Name / 0x742d...f2c8

Museum on museum.com:
  Short:  P-029-384-751-224
  Full:   P-029-384-751-224 / Institution Name / 0xB3F9...
```

**Important:** Institution names are not stored in the protocol and are not shown
by verifiers. Only the profile ID is on-chain. Verifiers display only the ID —
users must find it on the institution's official website to confirm identity.
This prevents anyone from registering as any institution name and gaining undeserved trust.

This is how the protocol works without a central registry: the participant's
existing public reputation becomes the proof of their identity. Anyone can
register — but only legitimate participants will have their ID findable
on a trusted public website.

### On packaging and physical objects

```
ODP-2026-03-004829301
C-482-930-174-005
```

The short format is intentionally compact — easy to type, read aloud, or print.

---

## 4. Proof Institution

Any museum, gallery, auction house, expert, or certification body can register
as a Proof Institution using the `P` type prefix. Registration is open to anyone
worldwide — no approval required.

### What a Proof Institution does

A registered Proof Institution can attach an on-chain **Proof record** to any
registered passport. This is an immutable public statement:
*"We examined this object and confirm its authenticity."*

Proof records do not modify the original passport. They accumulate alongside it.
The full proof history is permanently visible on-chain.

**The protocol does not verify whether a profile ID actually belongs to a claimed institution.**
Only the act of publicly publishing the profile ID on a real website — combined with the
institution's existing real-world reputation — provides the basis for trust.
Verifiers display only the profile ID, never a self-declared name.

### Optional P-affiliation (one parent per child)

When two Proof Institutions should appear linked in a simple hierarchy (head office
and a unit, an umbrella body and a member, a network and a node — the real-world
meaning is off-chain convention), the protocol allows an optional **one-level**
affiliation between `P` entities:

- Child `P` proposes a parent `P`
- Parent `P` confirms on-chain
- Child `P` can have **at most one active parent `P`**

This two-step handshake reduces spam and prevents unilateral trust claims.

```
ODP-2026-03-004829301  (original passport, 2026)
  └── Proof from P-029-384-751-224  04-2031
  └── Proof from P-482-930-174-005  09-2038
  └── Proof from P-001-293-847-119  01-2044
  └── Proof from P-774-002-391-888  12-2051
```

### Proof ID format

```
PRF-YYYY-MM-NNNNNNN
```

Generated using the same algorithm as Passport ID:

```
entropy = keccak256(block.timestamp + msg.sender + humanId + nonce)
number  = uint32(entropy) % 10_000_000
if number already exists for this year+month: nonce++, retry
proofId = "PRF-" + year + "-" + month + "-" + zero_pad(number, 7)
```

Example: `PRF-2031-03-7392018`

### Proof record fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `proofId` | `string` | yes | Auto-generated: `PRF-2031-03-7392018` |
| `prover` | `string` | yes | profile ID of the institution (e.g. `P-029-384-751-224`) |
| `humanId` | `string` | yes | Passport ID of the attested object (wire name `humanId`) |
| `noteHash` | `bytes32` | no | SHA-256 of an attached document. `bytes32(0)` if none |
| `noteUrl` | `string` | no | URL of the attached document (max 512 chars) |
| `timestamp` | `uint256` | yes | Set by the contract |

### Cost

Submitting a Proof record costs gas only (~$0.01 POL on Polygon).
No fees to the protocol.

### Public identity requirement for institutions

The public identity requirement from section 3 applies fully to Proof Institutions.
A Proof from an institution whose ID cannot be found on their official website
carries no verifiable value.

---

## 5. Verification Label

The verification label is an **optional** convenience layer.
Primary trust comes from on-chain records plus the seal state (NFC/numbered seal).
If used, the label helps end users verify faster.

### If a label is used: required elements

| Element | Description | Example |
|---------|-------------|---------|
| QR code | Encodes `odp://ODP-YYYY-MM-NNNNNNNNN`. Error correction level Q (25%) minimum | `odp://ODP-2026-03-004829301` |
| Passport ID (`humanId`) | Full object identifier in human-readable text | `ODP-2026-03-004829301` |
| Protocol mark | Protocol name or abbreviation | `ODP` or `Object Digital Passport` |

### Optional elements

Implementations may add any of the following — the protocol does not restrict them:

- profile ID in text (informational only; do not treat as trust anchor)
- Object title
- Creator name
- Year of creation
- Edition number
- Creator logo or visual identifier
- NFC chip (embedded in or under the label)
- Seal number (printed on the label or on a separate element)

**Trust note (normative):** profile ID printed on packaging/labels is **not** a trusted source by itself and is **not required** on the label. Verifiers should obtain profile ID from verified public sources (official website and public social profiles), then compare with on-chain data.

### If a label is used: seal retention requirement

The label should physically cover or retain the seal:

- If an NFC crypto chip (NTAG 424 DNA TagTamper) is used — it should be positioned
  under or within the label. The TagTamper chip permanently records removal electronically.
  Physical placement under the label adds an additional visual tamper indicator,
  but cryptographic tamper detection is provided by the chip itself, not the label.
- If a numbered seal is used — the label must overlap the seal so that
  removing the label requires removing the seal

### What this specification does NOT define for the label

- Size, shape, color, material
- Typography and visual design
- Layout of elements
- Manufacturer

These are implementation decisions. The specification defines only
what must be present, not how it must look.

---

## 6. Physical Seal

A physical seal binds the digital passport to the specific physical object.
**At least one seal method is required when minting a passport of type `physical`.**

Without a seal, the passport only proves that a record exists on-chain —
it does not prove that the object in front of you is the registered original.

Digital object passports (type `digital`) do not require a physical seal.
The file hash serves as the cryptographic binding.

### Method A — NFC Crypto Seal (NTAG 424 DNA TagTamper)

A cryptographic NFC chip embedded in or attached to the object.
Recommended for high-value objects, artwork, and collectibles.

**Required chip:** NXP NTAG 424 DNA TagTamper only.
Standard NTAG 424 DNA (without TagTamper) and standard NFC tags (NTAG213 etc.) are not supported.
Only TagTamper permanently records if the seal is physically removed.

**How it works:**

```
Registration:
  1. Read chip public key and UID via NFC
  2. Record in passport.json under seal.nfc
  3. Passport is hashed and registered on-chain as usual
  4. nfcPublicKey is also stored directly on-chain for fast
     cryptographic verification without fetching passport.json

Verification:
  1. Phone sends a random challenge to the chip via NFC
  2. Chip signs the challenge using its internal private key
     (private key is locked in silicon — never leaves the chip)
  3. Phone verifies signature against nfcPublicKey from blockchain
  4. Match    → original chip confirmed
     No match → wrong or cloned chip
```

**NTAG 424 DNA TagTamper behavior (the only supported NFC mode):**

Adds a tamper-detection antenna loop.
Physical removal permanently registers as a tamper event.

```
Seal intact   → chip reports: INTACT
Seal removed  → chip reports: TAMPERED (permanent, cannot be reset)
```

**Physical installation:**
The chip must be embedded or encapsulated so that removal causes
visible destruction. Installation method is described in `seal.nfc.notes`.

**NFC seal fields in passport.json:**

| Field | Required | Description |
|-------|----------|-------------|
| `uid` | yes | 7-byte chip UID, lowercase hex |
| `publicKey` | yes | ECC public key, hex string |
| `model` | yes | `NTAG424DNA_TT` — only TagTamper is accepted |
| `installedAt` | yes | ISO 8601 installation date (e.g. `2026-03-15`) |
| `notes` | no | Installation method, location, encapsulation material |

### Method B — Numbered Physical Seal

A physical seal with a unique printed number.
Examples: holographic sticker, wax seal, lead seal, tamper-evident label.

The creator is responsible for using a seal that cannot be removed without visible damage.
This method provides physical reference, not cryptographic proof.

**Numbered seal fields in passport.json:**

| Field | Required | Description |
|-------|----------|-------------|
| `number` | yes | Seal number exactly as printed |
| `type` | yes | Type of seal (e.g. `holographic sticker`, `wax seal`) |
| `color` | no | Color |
| `size` | no | Dimensions (e.g. `30x30mm`) |
| `notes` | no | Additional description |

### Seal requirement rule

| Condition | Valid? |
|-----------|--------|
| NFC crypto seal (NTAG 424 DNA TagTamper) | ✅ |
| Numbered seal only | ✅ |
| Both seals | ✅ |
| Standard NFC tag (NTAG213 etc.) | ❌ Not supported |
| No seal (physical object) | ❌ Contract rejects |
| No seal (digital object) | ✅ File hash is the binding |

### On-chain seal record

| Field | Type | Description |
|-------|------|-------------|
| `sealType` | `uint8` | `1` = NFC only, `2` = numbered only, `3` = both |
| `sealHash` | `bytes32` | SHA-256 of the `seal` object in passport.json |
| `nfcPublicKey` | `bytes` | NFC chip public key. Empty if no NFC seal |

---

## 7. Network

ODP v0.x is deployed exclusively on **Polygon PoS**.

| Property | Value |
|----------|-------|
| Network | Polygon PoS (mainnet) |
| Chain ID | 137 |
| Canonical v0.2 contract | `0x6c83c8C2e18c183a2776431a23187832b42FfFBb` ([PolygonScan](https://polygonscan.com/address/0x6c83c8C2e18c183a2776431a23187832b42FfFBb)) |
| Testnet | Polygon Amoy (chain ID 80002) |
| Gas token | POL (ex-POL) |
| Avg. mint cost | ~$0.01 |
| Avg. registration cost | ~$0.01 |

A single canonical network eliminates ambiguity in verification.
Multi-network support is reserved for a future version.

The official contract address for this v0.2 line is listed above and in the protocol repository.
Using a different address means operating a separate, incompatible registry.

---

## 8. On-Chain Record

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `humanId` | `string` | yes | `ODP-2026-03-004829301` |
| `creator` | `address` | yes | Wallet that minted |
| `creatorId` | `string` | yes | profile ID (mandatory — wallet must be registered) |
| `year` | `uint16` | yes | Registration year |
| `month` | `uint8` | yes | Registration month (1–12) |
| `objectType` | `string` | yes | `physical` or `digital` |
| `dataHash` | `bytes32` | yes | SHA-256 of minified `passport.json` |
| `imageHash` | `bytes32` | no | SHA-256 of primary image. `0x000...0` if none |
| `fileHash` | `bytes32` | no | SHA-256 of digital file. Required if `objectType = digital` |
| `sealType` | `uint8` | no | `1` = NFC, `2` = numbered, `3` = both. Required if `objectType = physical` |
| `sealHash` | `bytes32` | no | SHA-256 of `seal` object. Required if `objectType = physical` |
| `nfcPublicKey` | `bytes` | no | NFC chip public key. Empty if no NFC seal |
| `dataUrl` | `string` | yes | URL where the verifier obtains `passport.json` (max 512 chars): **raw JSON** response body, or **§15 `.odp`** ZIP containing `passport.json` |
| `imageUrl` | `string` | no | Image URL hint. Informational only |
| `timestamp` | `uint256` | yes | Set by the contract at mint time |
| `timestampTimeZone` | derived | yes | Fixed protocol interpretation: **`UTC` (GMT+0)**. Not stored separately on-chain; timezone is always offset 0. |

---

## 9. Passport JSON

### Hosting `dataUrl` (third-party sites)

`dataUrl` may point to any public HTTPS host (object storage, CDN, static site, Git forge, etc.). The last path segment SHOULD be `<humanId>.json` using the **exact** Passport ID string from the contract (same value as field `humanId`; e.g. `ODP-2026-03-004829301.json` — same casing as on-chain). If you host a **§15 `.odp`** ZIP instead of raw JSON, the last segment SHOULD be `<humanId>.odp`. Implementations that fetch the file MUST satisfy:

1. **HTTPS** — The URL uses TLS; the server returns HTTP **200** with a response body that yields the passport JSON octets: **raw JSON** only, or a **§15 `.odp` ZIP** from which **`passport.json`** is extracted per item 5 (not an HTML page, login prompt, or repository browser UI).
2. **Raw file on Git forges** — For GitHub, GitLab, and similar hosts, use the **raw** file URL (e.g. `raw.githubusercontent.com/.../passport.json`), not the HTML blob page.
3. **CORS (browser verifiers)** — Web-based verifiers run `fetch()` from their origin; the host SHOULD allow cross-origin **GET** for `dataUrl` so the browser can read the body (many static hosts and GitHub Raw do; a misconfigured private server may block verification).
4. **Integrity** — After canonicalization, the content MUST match `dataHash` on chain (see §10). Any byte change (including whitespace) changes the hash.
5. **`.odp` at `dataUrl` (optional)** — The HTTP **200** body MAY be a **ZIP** in the **§15 `.odp`** layout (path SHOULD end with **`.odp`**; response often `application/zip` or `application/octet-stream`). The verifier MUST extract **`passport.json`** and apply the **same** canonicalization and `dataHash` comparison as for raw JSON. **`manifest.json`** inside the archive is **not** a trust anchor for this step.

#### Creator responsibility for `passport.json` after mint (normative)

The protocol does **not** store the full passport JSON on-chain — only `dataHash` and related fields (see §8). The creator **must** retain the **canonical minified** `passport.json` octets. **v0.2** allows `dataUrl` to be empty at mint; if set, the creator **should** make those octets available at `dataUrl` for public web verification.

1. If `dataUrl` is **non-empty** but there is **no** HTTP **200** response whose body matches `dataHash` after canonicalization, verifiers **must** treat web-based verification as **failed** (e.g. **UNVERIFIABLE** / hash mismatch per §11 — exact state names are implementation-defined).
2. If `dataUrl` is **empty**, HTTP fetch cannot apply; only parties with the **passport.json** file can verify against `dataHash` (implementation-defined UX SHOULD warn the creator at mint time).
3. The creator **may** update `dataUrl` later via on-chain URL update (e.g. `updatePassportUrls` in the reference contract) **without** reminting, as long as the hosted file still matches `dataHash`.
4. **Reference and compatible UIs** SHOULD require **explicit user acknowledgement** immediately before submitting a mint transaction: that persisting `passport.json` is the creator’s responsibility; that public verification depends on that file being reachable at the registered URL when `dataUrl` is set; and that the user should download or copy the file before closing the success screen when the implementation provides that action.

### Issuer role and additional metadata (normative, v0.2)

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `issuerRole` | recommended | `string` | One of: `individual`, `brand`, `proof_institution`, `museum`. Describes the **role of the on-chain issuer** for this passport (e.g. museum cataloguing a work by a deceased artist → `museum`). SHOULD be consistent with the **`creatorId` prefix** (`C`/`B`/`P`/`M`) when applicable. |
| `additionalMetadata` | optional | `object` | Arbitrary **string keys** mapping to **string values** (Unicode NFC). Use for institution-specific or object-specific facts that are **not** modeled elsewhere — e.g. inventory number, accession id, permanent collection flag, exhibition note. Keys SHOULD be stable identifiers (`snake_case` or `camelCase`). |

These fields are part of the hashed `passport.json`; changing them changes `dataHash`.

### Registration instant and local clock (normative, v0.2)

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `registeredAt` | yes | `number` (integer) | **Unix time in seconds** (UTC instant) at registration — same instant as the on-chain `timestamp` intent. |
| `registration` | yes | `object` | Same instant as `registeredAt`, represented in privacy-safe UTC-only form. |
| `registration.utcIso8601` | yes | `string` | Same instant as `registeredAt`, in **UTC** with **`Z`** suffix and **second** precision (e.g. `2026-03-22T18:45:30Z`). Aligns with how chain / block time is interpreted (offset 0). |
| `registration.localIso8601` | yes | `string` | UTC-normalized ISO 8601 with numeric offset **`+00:00`**, **second** precision (e.g. `2026-03-22T18:45:30+00:00`). |
| `registration.ianaTimeZone` | yes | `string` | Always **`UTC`** in v0.2 privacy mode (no device-local IANA zone is recorded). |

Implementations MUST use the **same** UTC instant for `registeredAt`, `registration.utcIso8601`, and `registration.localIso8601`.
If local device time is shown to users, implementations MUST normalize that instant to **UTC (GMT+0)** before writing `passport.json`.

### Minimal valid passport — physical object

```json
{
  "version": "0.2",
  "humanId": "ODP-2026-03-004829301",
  "objectType": "physical",
  "type": "artwork",
  "title": "Object Community #1",
  "issuerRole": "individual",
  "creator": {
    "name": "Artist Name",
    "wallet": "0x742d...f2c8",
    "creatorId": "C-482-930-174-005"
  },
  "year": 2026,
  "month": 3,
  "registeredAt": 1748000000,
  "registration": {
    "ianaTimeZone": "UTC",
    "localIso8601": "2026-03-22T18:30:45+00:00",
    "utcIso8601": "2026-03-22T18:30:45Z"
  },
  "seal": {
    "nfc": {
      "uid": "04a3f912cc8b4e",
      "publicKey": "04b2e3f1a9c3d2...",
      "model": "NTAG424DNA_TT",
      "installedAt": "2026-03-15"
    }
  }
}
```

### Minimal valid passport — digital object

```json
{
  "version": "0.2",
  "humanId": "ODP-2026-03-000193847",
  "objectType": "digital",
  "type": "digital",
  "title": "Untitled #7",
  "issuerRole": "individual",
  "creator": {
    "name": "Artist Name",
    "wallet": "0x742d...f2c8",
    "creatorId": "C-482-930-174-005"
  },
  "year": 2026,
  "month": 3,
  "registeredAt": 1748000000,
  "registration": {
    "ianaTimeZone": "UTC",
    "localIso8601": "2026-03-22T18:30:45+00:00",
    "utcIso8601": "2026-03-22T18:30:45Z"
  },
  "digital": {
    "subtype": "image",
    "format": "TIFF",
    "fileHash": "sha256:abc123...",
    "fileSize": 48392810
  }
}
```

### Full passport — physical object (all optional fields)

```json
{
  "version": "0.2",
  "humanId": "ODP-2026-03-004829301",
  "objectType": "physical",
  "type": "artwork",
  "title": "Object Community #1",
  "issuerRole": "individual",
  "creator": {
    "name": "Artist Name",
    "wallet": "0x742d...f2c8",
    "creatorId": "C-482-930-174-005",
    "url": "https://artist.com"
  },
  "year": 2026,
  "month": 3,
  "registeredAt": 1748000000,
  "registration": {
    "ianaTimeZone": "UTC",
    "localIso8601": "2026-03-22T18:30:45+00:00",
    "utcIso8601": "2026-03-22T18:30:45Z"
  },
  "medium": "mixed media, Polaroid",
  "materials": [
    { "name": "canvas", "notes": "linen, primed" },
    { "name": "oil paint", "notes": "natural pigment" },
    { "name": "Polaroid photograph" }
  ],
  "dimensions": {
    "width": 60,
    "height": 40,
    "unit": "cm"
  },
  "edition": {
    "number": 1,
    "total": 3
  },
  "description": "...",
  "image": {
    "url": "https://artist.com/works/001.jpg",
    "hash": "sha256:abc123..."
  },
  "seal": {
    "nfc": {
      "uid": "04a3f912cc8b4e",
      "publicKey": "04b2e3f1a9c3d2...",
      "model": "NTAG424DNA_TT",
      "installedAt": "2026-03-15",
      "notes": "Embedded under varnish, bottom-right corner"
    },
    "numbered": {
      "number": "SL-00429831",
      "type": "holographic sticker",
      "color": "silver",
      "size": "30x30mm",
      "notes": "Applied over artist signature"
    }
  },
  "provenance": [
    {
      "event": "created",
      "date": "2026-02-22",
      "note": "Grey Scheme exhibition, Moscow"
    }
  ],
  "additionalMetadata": {
    "studio_notes": "Artist proof"
  }
}
```

### Full passport — digital object (all optional fields)

```json
{
  "version": "0.2",
  "humanId": "ODP-2026-03-000193847",
  "objectType": "digital",
  "type": "digital",
  "title": "Untitled #7",
  "issuerRole": "individual",
  "creator": {
    "name": "Artist Name",
    "wallet": "0x742d...f2c8",
    "creatorId": "C-482-930-174-005",
    "url": "https://artist.com"
  },
  "year": 2026,
  "month": 3,
  "registeredAt": 1748000000,
  "registration": {
    "ianaTimeZone": "UTC",
    "localIso8601": "2026-03-22T16:30:45-05:00",
    "utcIso8601": "2026-03-22T21:30:45Z"
  },
  "description": "...",
  "digital": {
    "subtype": "image",
    "format": "TIFF",
    "fileHash": "sha256:abc123...",
    "fileSize": 48392810,
    "dataUrl": "https://artist.com/works/007-original.tiff",
    "c2pa": {
      "manifestHash": "sha256:def456...",
      "specVersion": "2.1"
    }
  },
  "image": {
    "url": "https://artist.com/works/007-preview.jpg",
    "hash": "sha256:preview789..."
  },
  "provenance": [
    {
      "event": "created",
      "date": "2026-03-01"
    }
  ],
  "additionalMetadata": {
    "rights_note": "Artist retains copyright; NFT does not transfer IP."
  }
}
```

### `digital.subtype` values

| Value | Formats | Recommended master format |
|-------|---------|--------------------------|
| `image` | TIFF, PNG, PSD, RAW | Uncompressed original |
| `video` | ProRes, MOV, MP4 | Master without re-encoding |
| `3d` | GLB, OBJ, FBX | GLB (canonical for this protocol) |
| `audio` | WAV, FLAC, AIFF | Uncompressed master |
| `document` | PDF | Original PDF |
| `other` | Any | Original file |

### `type` values

| Value | Used with |
|-------|-----------|
| `artwork` | Painting, sculpture, drawing, mixed media |
| `photography` | Photography, Polaroid, prints |
| `digital` | Digital art, generative, software-based |
| `collectible` | Collectibles, limited editions, memorabilia |
| `document` | Documents, certificates, manuscripts |
| `object` | Any other physical object |

### Digital authorship principle

**Register before publishing.**

The creator who registers the file hash first is the author of record.
After registration, only derivative versions (compressed, watermarked,
reduced resolution) should be published publicly. The original file must
remain with the creator as cryptographic proof of authorship.

```
DO:     Register → then publish compressed/watermarked versions
DON'T:  Publish the original file before registering its hash
```

If someone else publishes the same file, the blockchain timestamp proves
who registered first.

### C2PA compatibility

ODP is compatible with the C2PA (Coalition for Content Provenance and Authenticity)
standard at the file hash level.

**Level 1 — Hash compatibility (autopol):**
If a file already contains an embedded C2PA manifest (created by Photoshop,
Lightroom, a Leica camera, or any C2PA-compliant tool), the SHA-256 of that
file captures both the content and the manifest inseparably.
No additional steps are required.

**Level 2 — Manifest hash (optional):**
If the creator wishes to make the C2PA manifest explicitly verifiable,
they may record its hash separately in `digital.c2pa.manifestHash`.
Verifiers that support C2PA can use this to display the full C2PA
provenance chain alongside the ODP verification result.

Recommended structure:

```json
"digital": {
  "subtype": "image",
  "fileHash": "sha256:...",
  "c2pa": {
    "manifestHash": "sha256:...",
    "activeManifest": "optional label"
  }
}
```

C2PA presence should be determined by a C2PA parser/validator (active manifest or manifest store found), not by ad-hoc byte signatures.
If no C2PA metadata is found, `digital.c2pa` should be omitted.

**Level 3 — ODP profile ID as C2PA assertion (future):**
C2PA allows custom assertions inside a manifest. A future extension of
this specification may define a standard `odp:creatorId` assertion,
allowing ODP profile IDs to be embedded inside C2PA manifests.

### Serialization rules

All string values in `passport.json` **must be in Unicode NFC normalization**
before hashing. This ensures identical `dataHash` across all implementations
regardless of platform (Python, JavaScript, mobile).

```
# Python
import unicodedata
value = unicodedata.normalize("NFC", value)

// JavaScript
value = value.normalize("NFC")
```

Any implementation that computes `dataHash` must normalize all string fields
to NFC before serialization. Failure to do so will cause legitimate passports
to appear as TAMPERED on other implementations.

### Rules

- `version`, `humanId`, `objectType`, and `creator.creatorId` are required
- For physical objects: at least one of `seal.nfc` or `seal.numbered` is required
- For digital objects: `digital.fileHash` is required
- `humanId` in JSON must exactly match the on-chain record
- `creator.wallet` must match the registered wallet in the Creator Registry
- Encoding: UTF-8
- The file must be minified before hashing

---

## 10. Hashing

### `dataHash`

```
dataHash = SHA-256( minified passport.json bytes )
```

1. Normalize all string values to Unicode NFC
2. Construct `passport.json` with all fields
3. Sort all keys alphabetically at every nesting level
4. Minify: no whitespace outside string values
5. Encode as UTF-8 bytes
6. Compute SHA-256 → store as `bytes32`

### `sealHash`

```
sealHash = SHA-256( minified seal object bytes )
```

The `seal` object is extracted, minified separately, and hashed.
Allows fast seal verification without re-hashing the full passport.

### `fileHash` (digital objects)

```
fileHash = SHA-256( raw file bytes )
```

Take the original file. Do not recompress, resize, or modify.
Compute SHA-256 of raw bytes. Store as hex string with `sha256:` prefix:

```
"sha256:abc123def456..."   ← correct format in passport.json
```

This format is used consistently in passport.json, Python CLI, and web UI.
The on-chain `fileHash` field is a raw `bytes32` (without prefix).

### `imageHash`

```
imageHash = SHA-256( raw image file bytes )
```

Do not modify the file in any way before hashing.

---

## 11. Verification Algorithm

### Level 1 — Object authenticity (always available)

```
INPUT: humanId (from QR, NFC, or manual entry)

1. Query contract: getPassport(humanId)
   → { dataHash, objectType, sealType, sealHash,
       nfcPublicKey, fileHash, dataUrl, creator, creatorId, timestamp }

2. If not found → INVALID

3. Query Creator Registry: getCreator(creatorId)
   → attach creator name and wallet to result

4. Query Proof records: getProofsForPassport(humanId)
   → fetch institution data for each proof

5. Fetch from `dataUrl`: raw `passport.json` text, or extract `passport.json` from a **§15 `.odp`** ZIP (detect **`.odp`** in the path or ZIP local header `PK\x03\x04`)

6. If fetch fails → UNVERIFIABLE
   (on-chain record still proves the object was registered)

7. Minify JSON → compute SHA-256

8. Match    → AUTHENTIC
   No match → TAMPERED
```

### Level 1B — Creator wallet proof (off-chain, EIP-191)

**Purpose:** Prove control of the **creator wallet** (`passport.creator`) **without** a blockchain transaction (no gas for the verifier).

**Not** proof of authorship of the artwork in a legal sense — only that the signer controls the key bound to that passport on-chain.

**Canonical message (v1)** — UTF-8 string, signed with Ethereum **EIP-191** (`personal_sign` / `eth_sign` with the standard message prefix):

```
Object Digital Passport — creator wallet proof (EIP-191) v1

humanId: <Passport ID>
chainId: <decimal chain ID>
contract: <registry contract address, EIP-55 checksum recommended>
nonce: <random unique string, e.g. 0x-prefixed hex>
```

**Verification steps:**

1. `recoveredAddress = ecrecover(EIP191(message), signature)` (as implemented by `ethers.verifyMessage` / equivalent).
2. `getPassport(humanId)` on the registry for that chain → read `creator`.
3. **Match** if `recoveredAddress == creator` (compare as addresses, case-insensitive).

The verifier should confirm `chainId` and `contract` in the message match the deployment being queried. Implementations may reject messages whose `humanId` line does not match the passport being checked.

**Reference web UI (v0.2):** The shipped `verify.html` page does **not** expose Level 1B. Integrators and wallets may still implement Level 1B per this section for interoperable off-chain proofs; the normative message format and verification steps above remain unchanged.

### Level 1C — External document hash (PDF, contract file)

**Purpose:** Anchor **SHA-256** of an off-chain file (e.g. PDF contract) to a **Creator wallet** on-chain so counterparties can verify the same bytes without trusting email attachments alone.

**On-chain (reference contract, generation ≥ 2):**

- `attestExternalDocument(bytes32 documentHash, string documentUri)` — caller must be registered; `documentHash` is SHA-256 of raw file bytes (same as `fileHash` encoding); `documentUri` optional HTTPS URL (max 512 chars); **at most one** attestation per `(wallet, documentHash)`.
- `getExternalDocumentAttestation(address wallet, bytes32 documentHash)` — returns `attested`, `creatorId`, timestamp, and `documentUri`.

**Verification:** compute SHA-256 of the local file; query the contract; **match** means the creator recorded this hash at `timestamp`. This does **not** replace qualified e-signatures or national law — it is a **public, immutable anchor** tying a wallet to a file hash.

**Reference web UI (v0.2):** `verify.html` implements Level 1C as follows:

- **Anchor (submit):** a registered wallet submits `attestExternalDocument(documentHash, "")`. The reference UI does **not** collect `documentUri`. The on-chain ABI still allows an optional HTTPS URL (max 512 chars) for other clients or scripted calls; attested URIs (if any) remain visible via `getExternalDocumentAttestation` and events.
- **Check (verify):** the user uploads a file; the page computes SHA-256 locally, then automatically searches the configured registry set for attestations of that hash (e.g. via `ExternalDocumentAttested` logs indexed by `documentHash`, confirmed with `getExternalDocumentAttestation`). The reference UI performs **global** discovery — it lists every wallet that anchored that hash — and does **not** require the verifier to enter a profile ID or wallet filter.

### Level 2A — NFC seal verification (physical, sealType 1 or 3)

```
1. Send random challenge to chip via NFC
2. Chip returns signed response
3. Verify signature against nfcPublicKey from blockchain
4. Match    → SEAL_NFC_AUTHENTIC
   No match → SEAL_NFC_INVALID

If chip is NTAG424DNA_TT:
5. Read tamper status
   INTACT   → SEAL_NFC_INTACT
   TAMPERED → SEAL_NFC_TAMPERED
```

### Level 2B — Numbered seal verification (physical, sealType 2 or 3)

```
1. Read seal.numbered.number from passport.json
2. User visually compares number on object to number in passport
3. Cannot be automated — requires human inspection
```

### Level 2C — File hash verification (digital objects)

```
1. User provides the original file
2. Compute SHA-256 of raw file bytes
3. Compare with fileHash from blockchain
4. Match    → FILE_AUTHENTIC (this is the registered original)
   No match → FILE_MISMATCH (different file — not the registered original)
```

### Level 3 — Image authenticity (optional)

```
1. If imageHash == 0x000...0 → NO_IMAGE_REGISTERED, stop
2. Compute SHA-256 of raw image bytes
3. Match    → IMAGE_AUTHENTIC
   No match → IMAGE_REPLACED
```

### Verification states

| State | Meaning |
|-------|---------|
| `AUTHENTIC` | Object registered, passport data verified |
| `INVALID` | humanId not found on blockchain |
| `UNVERIFIABLE` | Record exists, but dataUrl is unreachable |
| `TAMPERED` | Hash mismatch — passport.json was modified |
| `SEAL_NFC_AUTHENTIC` | NFC chip signature verified |
| `SEAL_NFC_INVALID` | NFC chip signature failed |
| `SEAL_NFC_INTACT` | TagTamper: seal never removed |
| `SEAL_NFC_TAMPERED` | TagTamper: seal was removed at some point |
| `FILE_AUTHENTIC` | File hash matches — this is the registered original |
| `FILE_MISMATCH` | File hash does not match |
| `IMAGE_AUTHENTIC` | Image hash matches |
| `IMAGE_REPLACED` | Image hash mismatch |
| `NO_IMAGE_REGISTERED` | No image hash on record |

---

## 12. QR Code

```
odp://ODP-2026-03-004829301
```

- Error correction: **Q** (25%) minimum
- Encoding: UTF-8
- Fallback: `https://verify.example.com/ODP-2026-03-004829301`

---

## 13. SDK Requirements

### Almost-ERC Read Standard (v0.2)

This section defines the practical “read-only integration surface” that other
developers should treat as stable for v0.2 verifiers.

Level 1 (core reading)
- `exists(humanId) -> bool` (no revert)
- `resolvePassport(humanId) -> (passport, creator, proofCount, contractVersion)` (reverts if not found)
- `getCreator(creatorId) -> CreatorRecord`
- `getProofsForPassportPaged(humanId, offset, limit) -> (proofIds[], total)` (pagination returns slice `[offset, offset+limit)`; does not copy full arrays first)
- `getProof(proofId) -> ProofRecord`

Optional Level 1 list endpoints
- `getPassportsByCreatorPaged(creatorWallet, offset, limit) -> (humanIds[], total)`

Core guarantees (invariants)
- Hashes are immutable after mint: `dataHash`, `imageHash`, `fileHash`, `sealHash`.
- `updatePassportUrls()` may change only URLs and requires `confirmedDataHash == on-chain dataHash`.
- `freeze()` is an irreversible one-time switch that stops new writes; it does not affect existing reads.

Affiliation note (P → P, one-level)
- `getPAffiliatedChildrenPaged(parentPId, offset, limit) -> (children[], total)` is the preferred pagination endpoint for verifiers/frontends.
- `getPAffiliatedChildren(parentPId) -> string[]` returns the entire list in v0.2. Verifier/frontends MUST treat the result as potentially large and apply UI/Network caps.
- Hard caps in v0.2: a single parent `P` can have at most **100 active child `P`**, and a single child `P` can have at most **100 pending parent proposals** at any moment.

Document anchoring
- `getExternalDocumentAttestation(wallet, documentHash)` returns metadata for a single `(wallet, hash)` attestation.
- Reference `verify.html` (v0.2) behaviour for document anchor + global hash check is specified under **Level 1C** above.

```
verify(humanId) → VerificationResult
  .status       // AUTHENTIC | INVALID | UNVERIFIABLE | TAMPERED
  .record       // on-chain data
  .creator      // Creator Registry record (always present)
  .proofs       // list of Proof records with institution data
  .passport     // parsed passport.json (if available)

verifyNFC(humanId, challenge, chipResponse) → NFCResult
  .status       // SEAL_NFC_AUTHENTIC | SEAL_NFC_INVALID
  .tamperStatus // SEAL_NFC_INTACT | SEAL_NFC_TAMPERED | null

verifyFile(humanId, fileBytes) → FileResult
  .status       // FILE_AUTHENTIC | FILE_MISMATCH

verifyImage(humanId, imageBytes) → ImageResult
  .status       // IMAGE_AUTHENTIC | IMAGE_REPLACED | NO_IMAGE_REGISTERED

mint(params) → humanId
  // physical: requires seal data
  // digital: requires digital.fileHash
  // wallet must be registered (profile ID mandatory)

registerCreator(type) → creatorId
  // type: "C" | "B" | "P" | "M"

submitProof(humanId, noteHash?, noteUrl?) → proofId
  // caller must be registered as type P or M

proposePAffiliation(parentPId)
confirmPAffiliation(childPId)
cancelPAffiliationRequest(parentPId)
isPAffiliationPending(parentPId, childPId) → bool
getPAffiliatedParent(childPId) → string
getPAffiliatedChildrenPaged(parentPId, offset, limit) → (children[], total)
getPAffiliatedChildren(parentPId) → string[]

getCreator(creatorId) → CreatorRecord
getProofsForPassport(humanId) → ProofRecord[]

computeDataHash(passportJson) → bytes32
computeSealHash(sealObject) → bytes32
computeFileHash(fileBytes) → bytes32
computeImageHash(imageBytes) → bytes32
```

---

## 14. Versioning

- This specification is **v0.2** (draft); `passport.json` uses `"version": "0.2"` for current examples
- Breaking changes increment the minor version: `0.2`, `0.3`, ...
- Stable release will be `1.0`
- All `passport.json` files include a `version` field for forward compatibility
- The contract is not upgradeable — a new protocol version deploys a new contract
- Type prefixes may only be added through an official specification update

---

## 15. `.odp` bundle (offline container)

An optional **`.odp` file** is a portable offline container for distributing and backing up an ODP passport.
It is designed to enable offline verifiers to recompute hashes and validate them against on-chain records.
The on-chain fields remain the cryptographic source of truth.

### 15.1 Format

`.odp` is a ZIP container (use the `.odp` extension; entries inside are UTF-8 filenames).

Expected ZIP entries:

- Mandatory:
  - `passport.json` — the canonical ODP `passport.json` document bytes (UTF-8 text).
  - `manifest.json` — bundle metadata for UX (not a trust anchor).
- Optional:
  - `original/<filename>` — original digital asset bytes corresponding to the on-chain `fileHash` (for digital passports).
  - `image/<filename>` — image bytes corresponding to the on-chain `imageHash` (when available).

#### 15.1.1 Reference `manifest.json` shape (implementations)

Reference tooling in this repository (`web/passport.html`, `tools/mint.py`) writes `manifest.json` as UTF-8 JSON with at least:

- `format`: `"odp-bundle"`
- `bundleVersion`: `"0.1"` (bump when the manifest schema changes in a breaking way)
- `humanId`, `createdAtUtc` (UTC ISO-8601, e.g. `2026-03-22T12:00:00Z`), `mode` (e.g. `"full"`)
- `onChain`: `dataHash`, `imageHash`, `fileHash` (`0x` + 64 hex, or all-zero), `txHash`, `chainId`, `contract` (checksummed address string where applicable)
- `files`: array of `{ path, role, mime }`; sidecar entries MAY include `sizeBytes` and `sha256` (`0x` + 64 hex)

Implementations MAY add keys. Verifiers MUST NOT treat `manifest.json` as a trust anchor; on-chain hashes and `passport.json` bytes remain authoritative.

### 15.2 Verification rules

An offline verifier of an `.odp` bundle MUST:

1. Extract `passport.json`.
2. Recompute `localDataHash` as SHA-256 of ODP canonical JSON (same canonicalization rules as the protocol verifier),
   using the bundle `humanId` normalization for chain-hash comparison (i.e. treat the bundle Passport ID as `humanId: null`
   when recomputing the chain-hash input).
3. Compare `localDataHash` to the on-chain `dataHash` for the claimed Passport ID (`humanId`).

If the on-chain record contains non-zero `fileHash` and the bundle contains `original/*`, a verifier SHOULD also:

- recompute SHA-256 of `original/*` bytes and compare it to `fileHash`.

Likewise, if the on-chain record contains non-zero `imageHash` and the bundle contains `image/*`, a verifier SHOULD also:

- recompute SHA-256 of `image/*` bytes and compare it to `imageHash`.

### 15.3 Trust model and limitations

- `.odp` is untrusted input and MUST be treated as data only (no code execution).
- `.odp` does not replace on-chain truth. Verification is always anchored by on-chain hashes (`dataHash`, and optionally `fileHash` / `imageHash`).
- In this v0.2 draft, no extra contract fields are required: existing on-chain hash fields are sufficient to validate the bundle.

---

## 16. What this protocol does NOT define

- Who hosts `passport.json` or digital files — the creator's responsibility
- What happens when `dataUrl` goes offline — the on-chain hash remains valid indefinitely
- UI or visual design of verifiers or labels
- Pricing or marketplace mechanics
- Transfer of ownership (may be defined in a future extension)
- Support for multiple blockchain networks (reserved for a future version)
- Human-readable names — profile ID is a number, not a name
- Which specific seal product to use — any seal meeting the requirements is valid
- Full C2PA integration beyond hash compatibility (reserved for a future extension)

---

## 17. Wallet & Key Management

ODP does not define how users manage their cryptographic keys.
The protocol only requires a valid Ethereum-compatible wallet address
to sign transactions. How the key is generated, stored, and secured
is entirely the user's responsibility and choice.

### Key generation principle

The private key must be generated on the user's own device.
It must never be transmitted to ODP infrastructure, any third-party server,
or any other party. The protocol has no mechanism to receive or store keys.

### Storage approaches

Three broad categories exist. The protocol is compatible with all of them:

**Category A — Software wallet (seed phrase)**
The key is derived from a 12–24 word seed phrase stored by the user.
The seed phrase is the master backup. If lost, the wallet cannot be recovered.
Users choosing this approach must:
- Write the seed phrase on paper immediately upon creation
- Verify the phrase by confirming word order as prompted
- Store the paper copy offline in a secure physical location
- Never store the seed phrase digitally (no photos, no cloud, no messaging apps)
- Keep at least one physical backup copy in a separate location

**Category B — Hardware device (seed phrase + physical security)**
The key is generated and stored inside a dedicated physical device.
Transactions are signed on the device and require physical confirmation.
A seed phrase is still generated as a backup — the same rules apply.
The physical device adds a layer of protection: even if the computer
is compromised, transactions cannot be signed without the device.

**Category C — Seed-less hardware (key in chip)**
Some physical devices generate a key inside a secure chip with no seed phrase.
The key never leaves the device in any form.
Users choosing this approach must:
- Purchase at least one additional backup device before registering
- Losing all devices means permanent loss of access to the profile ID and all passports
- There is no recovery path without a backup device

### What losing access means for ODP

If a creator loses their wallet:
- Their profile ID remains in the blockchain forever — nothing in ODP can ever be deleted
- All passports they minted remain valid and verifiable by anyone
- They can no longer mint new passports under that profile ID
- They can no longer update existing passports

Passports already minted are **not corrupted**. The blockchain record is permanent.
Only the ability to create new records under that identity is lost.

### Extensions (outside this specification)

The following are possible extensions that implementations may choose to build.
They are not part of the ODP protocol and are not standardized here:

- Encrypted key storage on a user-controlled server
- Key management integrated into a mobile application
- Multi-signature wallets (multiple keys required to sign)
- Social recovery schemes
- Any other approach compatible with Ethereum-signed transactions

---


---

*Object Digital Passport is open source. MIT License.*
*Contributions welcome. This is a draft — feedback is the goal.*
