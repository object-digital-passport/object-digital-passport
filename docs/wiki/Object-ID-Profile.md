# Object ID Profile — documenting for recovery

[Object ID](https://icom.museum/en/resources/standards-guidelines/objectid/) is the international checklist (ICOM) that museums, police, INTERPOL, and insurers use to describe cultural objects so they can be identified and recovered after theft. ODP passports can carry the full checklist — cryptographically timestamped.

> ODP is *compatible with* the Object ID checklist. It is not affiliated with or endorsed by ICOM.

## One document, two jobs

- **Authenticity:** hashes, seals, and institutional proofs answer "is this the registered original?"
- **Recovery:** the checklist answers "can this object be identified if it disappears?" — and the same *distinguishing features* (that repaired tear, that chalk mark on the stretcher) also help experts tell an original from a copy. A forger can clone a QR code; cloning a documented 3 cm repair is another matter.

## The nine categories → passport fields

| Object ID asks | You fill in |
| --- | --- |
| Type of object | `domain`, `physical.category` |
| Materials & techniques | `physical.medium`, `physical.materials` |
| Measurements | `physical.dimensions`, `physical.weight` |
| Inscriptions & markings | `physical.marks` |
| **Distinguishing features** | `objectId.distinguishingFeatures` — damage, repairs, defects; write each so a stranger could check it |
| Title | `title` |
| **Subject** | `objectId.subject` — what is depicted ("winter landscape with windmill…") |
| Date or period | `creationDate` |
| Maker | `authorship.author` |
| + Photograph | `image` — **mandatory** under this profile |

## Keep it private until you need it

Object ID practice says: store documentation securely, release it when something happens. ODP supports exactly that:

1. Mint with an **empty public link** — only fingerprints go on-chain; photos and features stay in your private `.odpass`.
2. If the object is stolen, hand the `.odpass` to police / registries (or publish it).
3. Anyone can verify the documentation against the **pre-theft** on-chain fingerprints and timestamp — proving the description wasn't invented after the fact.

And never put the object's storage address in the passport's public fields — see the [privacy rules](https://object-digital-passport.github.io/object-digital-passport/spec/#privacy-of-current-state-fields-normative).

Full profile text: [OBJECTID_PROFILE.md](https://object-digital-passport.github.io/object-digital-passport/spec/objectid-profile.html).
