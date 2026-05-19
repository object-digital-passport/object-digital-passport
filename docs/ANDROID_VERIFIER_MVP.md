# Android verifier MVP for ODP + TagTamper

This document describes the minimum useful scope for a dedicated Android verifier app for `ODP + NTAG 424 DNA TagTamper`.

It is intentionally narrower than "build a full issuer / registry app". The goal is a field verifier that can answer the right questions in the right order and report them separately.

The current Android scaffold lives at `../android-companion/` as a **separate temporary local Git repo inside the same workspace**. It implements the carrier read/write and result-state parts of this MVP. The repo can now optionally complete `AuthenticateEV2First` plus session-key derivation when a local EV2 AES key is provided, and it now attempts a first post-EV2 slice of authenticated reads (`GetCardUID`, `GetFileSettings`, `GetTTStatus`) without overstating full chip-to-passport proof.

## Why a dedicated app exists

The browser alone can already:

- load the ODP registry record
- verify canonical `.odpass` / `passport.json` against on-chain `dataHash`
- verify optional NDPP / offline payload hashes
- show on-chain `nfcPublicKey`

The browser alone does **not** currently perform:

- NTAG 424 DNA EV2/authenticated-read verification
- TagTamper state reading
- secure chip-session handling

So a dedicated Android verifier app is justified when you want one app to combine:

1. NFC runtime
2. chip authentication
3. chip-to-passport binding
4. canonical ODP registry verification

## The trust model the app must preserve

The app must keep these results distinct:

1. **Carrier opened**
   The phone read a URL or NDEF carrier and reached a verifier entry point.

2. **Offline payload matched**
   The app extracted the offline / NDPP payload and confirmed that its raw bytes match on-chain `ndppCommitmentHash`.

3. **Chip authenticated**
   The NTAG 424 DNA / TagTamper secure-session flow succeeded.

4. **Tamper state read**
   The app learned the TagTamper state from the chip.

5. **Chip bound to passport**
   The documented live mirror-profile bytes obtained from the NFC flow match on-chain `nfcPublicKey` for the selected passport.

6. **Canonical passport verified**
   The app verified `.odpass` / `passport.json` against on-chain `dataHash`.

No single one of these results should be presented as if it automatically implies all the others.

## Minimum functional requirements

### 1. Accept the passport entry point

The app should be able to start from at least one of:

- Passport ID
- Verify URL
- NFC carrier tap
- local `.odpass`
- structured ODP web handoff (JSON text, share target, or deep link)

If the NFC carrier is URL-first, the app may use the first URL record as the entry point, but it must not confuse that with chip authentication.

For the current reference deployment, that first URL should be the GitHub-hosted Verify page. The stable-v1 target can later switch the first-link target to `odp://...` when resolver / app context is ready.

### 2. Read NFC carriers correctly

For URL-first multi-record NDEF carriers, the app should:

- read the first URL / URI record as the phone-friendly entry point
- look for the secondary `odp:off` payload record
- hash the **raw payload bytes of that secondary record**

It must **not** hash:

- the whole NDEF message
- the URL record bytes
- the NDEF wrapper bytes

The invariant is:

```text
ndppCommitmentHash = SHA-256(raw offline / NDPP payload bytes)
```

### 3. Perform chip authentication

The app must run the compatible NTAG 424 DNA / TagTamper authentication flow and report:

- authentication success / failure
- any relevant chip identifier or public verification output
- TagTamper state

For the current scaffold, this requirement is partially met:

- `AuthenticateEV2First` can now be attempted and honestly reported as probe-only, attempted-but-incomplete, or EV2-authenticated
- the app can now extract `Read_Sig` originality-signature bytes and try to verify them against NXP's published secp224r1 originality public key using the observed UID
- after EV2 auth, the app now attempts authenticated `GetCardUID`, `GetFileSettings`, and `GetTTStatus` reads and reports their evidence separately from the EV2/session step
- after EV2 auth, the app can also attempt an authenticated `ReadData` against a configured StandardData file and treat the returned bytes as directly comparable only when the operator explicitly declares that file to be the chip's stored binding public-key source
- live arbitrary challenge-response against the on-chain `nfcPublicKey` key family still remains future work whenever no defensible protected-file public-key source exists

The low-level implementation may be informed by technical references such as `AndroidCrypto/Ntag424SdmFeature`, but the verifier app should keep this behind its own interface so the rest of the ODP architecture does not depend on one external project layout.

### 4. Bind the chip to the passport

After chip authentication, the app must compare the chip-side public key or equivalent documented live verification material to on-chain `nfcPublicKey`.

This is the chip-to-passport binding step.

Without this step, a successful chip authentication only proves "a valid chip responded", not "this chip belongs to this passport".

The current Android slice narrows that gap in two honest ways:

- it surfaces authenticated UID evidence after EV2 auth
- it surfaces `Read_Sig` originality evidence tied to the UID and verifiable against NXP's public originality key
- it can now surface authenticated bytes from a configured protected StandardData file, with direct comparison enabled only when that file is explicitly treated as the chip's stored binding public key

Current concrete reference profile for that protected-file path:

- profile id: `odp-ntag424-nfc-public-key-file-v1`
- protected StandardData file: `0x03`
- file contents: bytes at offset `0x000000` must exactly equal the on-chain `nfcPublicKey` byte string
- framing: none beyond those raw bytes
- read mode: `FULL`
- read length: derived from the expected on-chain `nfcPublicKey` length

That profile is what lets the app report a real `chipKeyMatch` without pretending that manufacturer originality proof or authenticated UID evidence are equivalent to passport-specific key binding.

Those are all useful live chip proofs, but only the protected-file path is directly comparable, and only under the explicit deployment assumption that the file really stores the same chip-side public material published on-chain as `nfcPublicKey`. For the current NTAG 424 deployment, that protected-file mirror profile is the strongest honest deployable path. Otherwise `chipKeyMatch` must stay unavailable until a future deployment can run or observe chip-side challenge-response material from the same key family as the on-chain value.

For the current Pixel pilot, the ODP web helper handoff preselects that profile for the current `NTAG424DNA_TAGTAMPER` reference deployment so the Android verifier starts in the honest directly comparable path without manual operator re-entry.

### 5. Verify the canonical ODP passport

The app should resolve the passport record and verify:

- `Passport ID`
- on-chain record presence
- canonical `.odpass` / `passport.json`
- `dataHash`
- optional media hashes when available

If this part cannot be completed because the hosted artifact is missing, the app should say so explicitly instead of overstating confidence.

For the current MVP slice, local `.odpass` / `passport.json` intake is already a useful fallback even before full in-app hosted-bundle fetching exists. That means the app can still verify canonical JSON bytes against `dataHash` when the operator has the local file, while clearly reporting that hosted/network resolution is not implemented yet.

### 6. Verify optional NDPP / offline payloads

If a secondary payload record or hosted public payload is available, the app should:

1. obtain the raw payload bytes
2. compute `SHA-256(raw bytes)`
3. compare with `ndppCommitmentHash`

This result should be shown as an **additional** public-disclosure / offline layer, not as the primary authenticity anchor.

## Minimum result screen

The app should show separate result rows such as:

- carrier opened: yes / no
- verify entry URL: value
- verify entry URL matched expected: yes / no / not checked
- passport ID matched across URL + payload + expected value: yes / no / unavailable
- offline payload present: yes / no
- offline payload hash matched: yes / no / not checked
- chip authenticated: yes / no
- tamper state: intact / tampered / unavailable
- chip key matched on-chain `nfcPublicKey`: yes / no / unavailable
- adjacent public proof present (for example `Read_Sig` originality evidence): yes / no / unavailable
- direct comparable chip-binding bytes present (for example authenticated protected-file key bytes): yes / no / unavailable
- embedded payload `dataHash` matched: yes / no / unavailable
- canonical passport `dataHash` matched: yes / no / unavailable
- observed values and mismatch reasoning: visible to the operator

This separation is more important than fancy UI.

## What TagWriter can and cannot do

`NXP TagWriter` can:

- write a URL record
- write an exported `.ndef` carrier
- make the object open a verifier entry point on tap

`NXP TagWriter` cannot:

- authenticate the NTAG 424 DNA chip
- read TagTamper state
- compare the chip result with on-chain `nfcPublicKey`
- verify `.odpass` / `dataHash`

## What Tag TrustLink can and cannot do

`Tag TrustLink` can:

- run the compatible chip-side authentication flow
- read TagTamper status
- validate the chip / secure message flow

`Tag TrustLink` cannot, by itself:

- prove that the chip belongs to a specific ODP passport unless the operator compares its public key with on-chain `nfcPublicKey`
- verify canonical `.odpass` / `dataHash`
- replace the ODP registry verification layer

## Recommended MVP boundary

The first dedicated Android verifier should do these things well:

1. read the carrier
2. authenticate the chip
3. bind the chip to on-chain `nfcPublicKey`
4. verify canonical ODP data
5. optionally verify the offline / NDPP payload
6. report each result separately

It does **not** need, in the MVP, to become a full issuer workstation, a generic DPP editor, or a general-purpose NFC writing tool.

## Pixel pilot-ready boundary

For the current pilot APK on a Pixel, the practical success path is narrower than a spec-max verifier:

1. import trusted values and the pilot binding profile from ODP web,
2. scan the URL-first carrier and `odp:off` payload,
3. attempt EV2 auth when the local deployment key is available,
4. read TagTamper / authenticated follow-up evidence,
5. compare the protected-file bytes against on-chain `nfcPublicKey`,
6. optionally compare local canonical `.odpass` / `passport.json` bytes against `dataHash`.

That is enough for the pilot even though broader generic profile discovery, wider chip command coverage, and challenge-response paths remain future work.
