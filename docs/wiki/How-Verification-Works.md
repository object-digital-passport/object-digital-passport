# How Verification Works

> 🌐 **English** · [Русский](How-Verification-Works-ru)

No cryptography degree needed — here's the whole model.

## The fingerprint idea

When a passport is minted, the system computes a **SHA-256 hash** — a unique fingerprint — of the passport document (and of each photo and file). Only these fingerprints go on the blockchain. Change one comma in the description, and the fingerprint no longer matches: tampering is instantly visible.

The blockchain acts as a public, permanent notary log: *"this fingerprint was registered by this wallet at this time."* Nobody — not even the project author — can edit or delete it.

## The trust layers (strongest first)

| Layer | What it proves | How |
| --- | --- | --- |
| 1. On-chain record | The passport exists, since when, issued by which wallet | Blockchain lookup — free, works forever |
| 2. Data hash | The description you're reading is byte-for-byte the registered one | Compare fingerprint of `.odpass` content with on-chain `dataHash` |
| 3. File / image hashes | The digital original or photos are the registered ones | Same fingerprint comparison per file |
| 4. Issuer identity | A real person/organization stands behind the profile ID | **Human step:** find the ID on their official site |
| 5. Institutional proofs | Experts or museums vouched for the object | On-chain proof records from P/M profiles (check *their* IDs the same way) |
| 6. Physical seal | The physical object is linked to the passport | Numbered seal (visual) or NFC chip (see [NFC Seals](NFC-Seals)) |

No single layer is magic. A counterfeiter can copy a QR code — but can't fake the hashes, the timestamp, or the issuer's public identity, and physical [distinguishing features](Object-ID-Profile) are checked by human eyes.

## What the results mean

- **AUTHENTIC** — record found, hosted passport data matches the on-chain fingerprint.
- **UNVERIFIABLE** — record exists, but the passport bundle isn't reachable (issuer may host it later, or hands it over privately). The on-chain proof still stands.
- **TAMPERED** — the hosted data does **not** match the fingerprint. Red flag.
- **INVALID** — no such Passport ID on this registry.
- Seal results (`SEAL_NFC_*`) are separate — a seal check is about the physical object, not the document. See [NFC Seals](NFC-Seals) for what each level actually proves.

## What ODP does NOT prove

Honesty matters more than marketing:

- It does not prove the *legal* authorship or ownership of a work — courts and experts do that.
- It does not prove a P- or M-profile is really a museum — **you** confirm that on the institution's official site.
- A passport for a fake object is still a fake object with a passport. The registry proves *registration*, humans prove *authenticity* — ODP gives them tamper-proof material to work with.
