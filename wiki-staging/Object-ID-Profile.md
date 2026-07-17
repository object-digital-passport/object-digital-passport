# Object ID Profile — documenting for recovery

> 🇬🇧 **English** · [🇷🇺 Русский](Object-ID-Profile-ru)

[Object ID](https://icom.museum/en/resources/standards-guidelines/objectid/) is the international checklist (ICOM) that museums, police, INTERPOL, and insurers use to describe cultural objects so they can be identified and recovered after theft. Since **v0.6**, ODP doesn't just *carry* the checklist — the passport data model is *built on it*: the identification categories are first-class fields and anchors, cryptographically timestamped.

> ODP is *compatible with* the Object ID checklist. It is not affiliated with or endorsed by ICOM.

## One document, two jobs

- **Authenticity:** hashes, anchors, and institutional proofs answer "is this the registered original?"
- **Recovery:** the checklist answers "can this object be identified if it disappears?" — and the same *distinguishing features* (that repaired tear, that chalk mark on the stretcher) also help experts tell an original from a copy. A forger can clone a QR code; cloning a documented 3 cm repair is another matter.

## The nine categories → passport fields (v0.6)

| Object ID asks | Where it lives in the passport |
| --- | --- |
| Type of object | `domain` + `objectType` (also `physical.category`) |
| Materials & techniques | `materials` anchor (plus `physical.medium`) — **mandatory** for physical objects |
| Measurements | `dimensions` anchor — **mandatory** for physical objects |
| Inscriptions & markings | `marks` anchor |
| **Distinguishing features** | `distinguishing_features` anchor — **mandatory**; damage, repairs, defects — write each so a stranger could check it |
| Title | `title` — stored directly **on-chain** in the passport card |
| **Subject** (what is depicted) | `shortDescription` (on-chain card) and the full `description` |
| Date or period | `creationDate` |
| Maker | `authorName` (on-chain card) + `authorship.author` |
| + Photograph | `photo` anchor — **mandatory** for physical objects |

All identification facts live in one `anchors[]` block inside `passport.json`, fingerprinted on-chain as `anchorsHash`. The contract **refuses to mint** a physical-object passport without the hard minimum: photo + dimensions + materials + distinguishing features. So every v0.6 passport is recovery-grade documentation by construction, not by good intentions.

## Keep it private until you need it

Object ID practice says: store documentation securely, release it when something happens. ODP supports exactly that:

1. Mint with an **empty public link** — only fingerprints go on-chain; photos and features stay in your private `.odpass`.
2. If the object is stolen, hand the `.odpass` to police / registries (or publish it).
3. Anyone can verify the documentation against the **pre-theft** on-chain fingerprints and timestamp — proving the description wasn't invented after the fact.

And never put the object's storage address in public on-chain data — location events are public forever, so record only coarse values ([privacy rule](https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md#immutable-core-vs-append-only-events-normative)).

Full field rules: [SPEC §9 — Passport JSON](https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md#9-passport-json) · design rationale: [REQUIREMENTS_FIELDS_V0.6.md](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/REQUIREMENTS_FIELDS_V0.6.md) (in Russian).
