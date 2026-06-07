# Android companion — ODP integration

The reference NFC verifier app lives in a separate repository:

**[object-digital-passport/odp-android-companion](https://github.com/object-digital-passport/odp-android-companion)**

Build, guided UX, operator tools, and TagTamper pilot notes are documented there ([README](https://github.com/object-digital-passport/odp-android-companion/blob/main/README.md), [NTAG424 pilot](https://github.com/object-digital-passport/odp-android-companion/blob/main/docs/NTAG424_TAGTAMPER.md)).

This repo keeps protocol rules, the web UI, and the handoff bridge only.

## Role in ODP

| Layer | Where |
|-------|--------|
| Registry, hashes, SPEC | This repo — [SPEC.md](../SPEC.md) |
| Verify / Passport web UI | [web/frontend/verify.html](../web/frontend/verify.html), [web/frontend/passport.html](../web/frontend/passport.html) |
| Web → Android handoff | [web/frontend/js/odp-android-companion.js](../web/frontend/js/odp-android-companion.js) |
| NFC runtime on device | [odp-android-companion](https://github.com/object-digital-passport/odp-android-companion) |

The companion does **not** replace on-chain verification in the browser. It adds NFC carrier read/write, EV2/TagTamper evidence, and honest separate result rows.

## Handoff

Export from Verify or Manage passport produces versioned JSON (`odp-android-companion-handoff`) with trusted fields:

- `passportId`, `verifyUrl`, `ndppCommitmentHash`, `nfcPublicKey`, `dataHash`
- optional `chipBinding.profileId`, `proof`, `route`

Delivery:

- **Deep link:** `odpcompanion://import?handoff=<url-encoded-json>`
- **Share / copy** — same JSON as plain text

Implementation: [`web/frontend/js/odp-android-companion.js`](../web/frontend/js/odp-android-companion.js) (`buildAndroidCompanionHandoff`, `openAndroidCompanionImport`).

## Carrier shape (reference)

NDEF record 1: GitHub-hosted Verify URL. Record 2: raw `odp:off` bytes.  
`ndppCommitmentHash = SHA-256(raw offline payload bytes)` — not the URL or full NDEF message.

First-link target remains Verify Pages until `odp://` resolver context exists (SPEC).

## Trust steps (keep separate)

1. Carrier opened  
2. Offline payload vs `ndppCommitmentHash`  
3. Chip session (EV2 / TagTamper)  
4. Chip vs on-chain `nfcPublicKey` (mirror profile or EV2 key per deployment)  
5. Canonical `.odpass` / `dataHash`  

Normative NFC wording: **SPEC** (issuer order, `highAssuranceSeal` for TagTamper).  
Practical chip + TagWriter workflow: [ANDROID_NTAG424DNA_TAGTAMPER.md](ANDROID_NTAG424DNA_TAGTAMPER.md).  
MVP scope checklist: [ANDROID_VERIFIER_MVP.md](ANDROID_VERIFIER_MVP.md).

## Install (pilot)

Download debug APK from [Releases](https://github.com/object-digital-passport/odp-android-companion/releases) or build from the companion repo (`./gradlew assembleDebug`).
