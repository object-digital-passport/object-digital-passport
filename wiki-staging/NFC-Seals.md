# NFC Seals

> 🇬🇧 **English** · [🇷🇺 Русский](NFC-Seals-ru)

A physical seal ties the passport to the physical object. ODP supports numbered tamper-evident seals (checked by eye) and **NFC crypto chips** — currently NXP **NTAG 424 DNA** and its **TagTamper** variant (detects if the seal was ever peeled off).

**Since v0.6 a seal is optional.** The mandatory identification for a physical object is the anchor minimum — photo + dimensions + materials + distinguishing features (see [Object ID Profile](Object-ID-Profile)). A seal is an *additional* anchor (`nfc` or `numbered_seal`) on top of that minimum, recommended for high-value objects. Its data lives in the passport's `anchors[]` block and is integrity-anchored on-chain via `dataHash` / `anchorsHash` — there are no dedicated on-chain seal fields anymore.

## What an NFC check actually proves (be honest with yourself)

The v0.6 verification model is **published-key symmetric challenge-response**: the chip's 16-byte EV2 application key is published inside the integrity-anchored `nfc` anchor, and the verifier's phone runs NTAG 424 DNA's native mutual authentication (EV2) with that key.

| A PASS means | A PASS does **not** mean |
| --- | --- |
| A live chip holding the anchored key is physically present — not just a copied URL or QR | That the chip is unique: the key is public, so a determined forger can program another NTAG 424 with the same key |
| The chip answered a fresh challenge (not a replayed recording) | That the *object* is authentic — that's what the identification anchors and human expertise are for |
| With **TagTamper**: the seal loop has never been opened (permanent `TAMPERED` flag otherwise) | That a thief with the original object and seal can be detected |

What the check **does** block: URL-only fake tags, wrong chips carrying another key, and physically opened TagTamper seals. The reference Android companion additionally requires an authenticated **UID match** and an `INTACT` TagTamper state before reporting a scan as *high assurance*.

Rule of thumb: treat an NFC PASS as one strong anchor among several, never as "authentic" by itself — a verifier that claims authenticity from a chip check alone is overselling. Full model and its honest limits: [SPEC §6 — Physical Seal](https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md#6-physical-seal).

## Phone support

### Android

Full support today: reading, EV2 challenge-response, TagTamper status, and chip provisioning via the [Android companion app](https://github.com/object-digital-passport/odp-android-companion). Chrome on Android also supports Web NFC for simple reads.

### iPhone

- **Opening the verify link — works out of the box.** The chip carries a normal URL; iPhone XS and newer read NFC tags in the background — tap the object and the Verify page opens with the passport's on-chain record. No app needed.
- **EV2 challenge-response and TagTamper status — need a native iOS app.** iOS does give apps low-level access (ISO 7816 APDUs via Core NFC, iOS 13+), so an iOS companion is technically possible — it just doesn't exist yet. Safari has no Web NFC, so a browser-only flow can't do it.
- **Provisioning (writing keys, enabling TagTamper) from an iPhone — same story:** possible only inside a native app; today issuers provision chips with the Android companion.

Practical takeaway: an iPhone user today gets the document-level verification (hashes, card, anchors) plus the tap-to-open convenience; the cryptographic chip check itself currently requires an Android device.

## For issuers: the required order

1. Provision the chip **before** minting (load the EV2 key, enable TagTamper if used).
2. Scan the live chip and import its data into the passport form — this prevents publishing a wrong UID or key on-chain.
3. Mint; then write the verify URL onto the chip.

Full walkthrough: [ISSUER_NFC_FLOW.md](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/ISSUER_NFC_FLOW.md).
