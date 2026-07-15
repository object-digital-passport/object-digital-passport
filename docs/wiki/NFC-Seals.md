# NFC Seals

> 🌐 **English** · [Русский](NFC-Seals-ru)

A physical seal ties the passport to the physical object. ODP supports numbered tamper-evident seals (checked by eye) and **NFC crypto chips** — currently NXP **NTAG 424 DNA** and its **TagTamper** variant (detects if the seal was ever peeled off).

## What an NFC check actually proves (be honest with yourself)

Since v0.6 the spec defines two verification profiles with very different guarantees:

| | **Profile A** — published key (legacy) | **Profile B** — issuer-verified SDM (recommended for valuables) |
| --- | --- | --- |
| How it works | The chip's AES key is published on-chain; any phone can run a challenge-response | The key stays **secret with the issuer**; every tap produces a fresh one-time code (CMAC + counter), checked by the issuer's endpoint |
| What a PASS means | The tag was programmed with the publicly known key | This exact tap came from a chip holding the secret key, and it's not a replay |
| Can it be cloned? | **Yes** — the key is public, anyone can program a blank chip with it. Treat as a presence indicator only | **No**, as long as the issuer's key isn't leaked |
| Needs internet? | No | Yes (issuer's verification service) |

Rule of thumb: for expensive objects, ask the issuer to use **Profile B**. Profile A is a convenience layer, never proof of authenticity — a verifier that shows "authentic" from a Profile A check alone is lying to you.

Details: [assurance matrix in the spec](https://object-digital-passport.github.io/object-digital-passport/spec/#seal-verification-profiles-and-assurance-matrix-normative).

## Phone support

### Android

Full support today: reading, EV2 challenge-response, TagTamper status, and chip provisioning via the [Android companion app](https://github.com/object-digital-passport/odp-android-companion). Chrome on Android also supports Web NFC for simple reads.

### iPhone

- **Verifying a Profile B (SDM) seal — works out of the box.** The chip emits a normal URL with the one-time code; iPhone XS and newer read NFC tags in the background — tap the object, the verify link opens, done. No app needed. (iPhone 7–X can read via a Core NFC app.)
- **Profile A challenge-response and TagTamper status — needs a native iOS app.** iOS gives apps low-level access (ISO 7816 APDUs via Core NFC, iOS 13+), so an iOS companion is technically possible — it just doesn't exist yet. Safari has no Web NFC, so a browser-only flow can't do it.
- **Provisioning (writing keys, enabling SDM/TagTamper) from an iPhone — same story:** possible only inside a native app with Core NFC; today issuers provision chips with the Android companion.

Practical takeaway: **Profile B is the most iPhone-friendly option** — background tag reading covers the whole verification flow for end users.

## For issuers: the required order

1. Provision the chip **before** minting (load keys, enable TagTamper if used).
2. Scan the live chip and import its data into the passport form — this prevents publishing a wrong UID or key on-chain.
3. Mint; then write the verify URL onto the chip.

Full walkthrough: [ISSUER_NFC_FLOW.md](https://github.com/object-digital-passport/object-digital-passport/blob/main/docs/ISSUER_NFC_FLOW.md).
