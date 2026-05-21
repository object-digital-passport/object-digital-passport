# Android companion app (`android-companion/`)

The Android companion is now a guided verifier flow, not a single diagnostic panel.

Its job is simple:

1. receive trusted setup from ODP web or manual input,
2. tell the user when to tap the NFC tag,
3. return a plain-language result first,
4. keep EV2, binding profiles, and writer tooling in an operator-only area.

## Guided user flow

The novice flow is intentionally sequential:

1. `Welcome`
2. `Get trusted setup`
3. `Review trusted values`
4. `Optional local passport file`
5. `Tap NFC now`
6. `Scan result`
7. `Technical details`

The app keeps explicit session state for the current step, so web handoff or share/open actions can land the user directly in the right place instead of merely filling fields on a long form.

## Operator area

The default guided flow does **not** open with:

- EV2 key inputs
- binding-profile controls
- manual file-number / offset / length fields
- URL-first writer tooling

Those controls live in `Operator tools`.

This keeps the novice path understandable while still preserving the current mirror-profile and issuer/operator workflows for field testing.

## Trusted setup intake

The app accepts:

- versioned Android handoff JSON
- `odpcompanion://import?...` deep links
- Android shared text
- local `.odpass`
- local `passport.json`

Trusted setup remains the same five ODP-side values:

- `passportId`
- `verifyUrl`
- `ndppCommitmentHash`
- `nfcPublicKey`
- `dataHash`

The optional local file step is only for recomputing canonical `dataHash` on-device. It is not required for a basic NFC scan.

## Explicit proof-method model

The Android app, web handoff, and docs now use an explicit proof-method vocabulary:

- `manufacturerOriginality`
- `ev2SessionAuth`
- `tagTamperState`
- `directComparableStoredKey`
- `trueChallengeResponse`

Important meaning:

- `manufacturerOriginality` means `Read_Sig` / NXP originality evidence. It helps show a genuine NXP chip family response, but it is **not** passport binding.
- `ev2SessionAuth` means the phone established an EV2-authenticated session. It is stronger than probe-only evidence, but still **not** passport binding by itself.
- `tagTamperState` means the authenticated tamper/seal state when the tag and access rights allow it.
- `directComparableStoredKey` means the app read authenticated bytes from a documented protected file and compared them directly with the on-chain `nfcPublicKey`.
- `trueChallengeResponse` means a real chip-native arbitrary challenge/response verified against the on-chain `nfcPublicKey`.

## NTAG 424 trust resolution

For the current ODP deployment and the evidence currently available in this repo, the app and docs now take the following honest position:

- the companion app **does** support real low-level NTAG 424 probing
- it **does** support EV2 session establishment when the operator provides the correct local AES key
- it **does** support authenticated follow-up reads like UID, file settings, TagTamper, and protected file reads
- it **does** support a defensible mirror-profile path where authenticated stored bytes are compared directly with on-chain `nfcPublicKey`
- it does **not** currently have a defensible end-to-end chip-native arbitrary challenge/response protocol for this deployment that can be verified against the on-chain `nfcPublicKey`

So the strongest honest production wording here is:

> For NTAG 424 DNA in this deployment, the documented mirror profile is the strongest honest deployable path. It is not the same thing as claiming a true chip-native challenge/response proof.

## Mirror profile

Current reference profile:

- profile id: `odp-ntag424-nfc-public-key-file-v1`
- file: protected StandardData file `0x03`
- offset: `0x000000`
- read mode: `FULL`
- comparison rule: the authenticated bytes must equal the on-chain `nfcPublicKey` byte-for-byte

This profile is meaningful only when:

1. the issuer really provisioned the tag that way,
2. the verifier loaded the correct expected `nfcPublicKey`,
3. the app performed authenticated reading from that documented file.

If that provisioning rule cannot be justified, the app must keep `chipKeyMatch` unavailable.

## Web handoff v2

The Android handoff metadata now carries two extra ideas:

1. `proof`
2. `route`

`proof` tells Android which proof method is primary and which supporting methods are relevant.

`route` tells Android which screen to open first, for example:

- `ready-to-scan` for normal verifier use from `verify.html`
- `advanced-operator` when `passport.html` is preparing a write/operator session

That means:

- novice users can open straight into the guided scan path
- operator/manage flows can still jump directly into the advanced branch

## Result wording rules

The app now separates these statements clearly:

- carrier opened
- public payload matched
- EV2 session authenticated
- TagTamper state observed
- direct comparable stored key matched
- true challenge-response not claimed here

The result screen always prefers plain language such as:

- what matched
- what this proves
- what this does not prove

Technical transcript cards remain available on the details screen.

## Build

Requirements:

- JDK 17
- Android SDK / platform tools with API 36
- Android SDK path configured via Android Studio, `ANDROID_HOME`, or `local.properties`

From the Android project root:

```bash
cd android-companion
./gradlew assembleDebug
```

## Current honest scope

Already real:

- guided multi-screen verifier UX
- versioned handoff import and routing
- explicit proof-method model in app state
- novice-first result wording
- operator-only EV2 / binding / writer controls
- low-level NTAG 424 probing
- `Read_Sig` originality extraction
- optional EV2 auth
- authenticated post-EV2 reads
- mirror-profile comparison path

Not claimed as complete here:

- backend-assisted key custody / HSM flow
- generic production-ready operator key management
- defensible NTAG 424 true challenge-response against the on-chain `nfcPublicKey`
- automatic on-chain fetch inside the Android app without web handoff
# Android companion app (`android-companion/`)

The Android companion is now a guided verifier flow, not a single diagnostic panel.

Its job is simple:

1. receive trusted setup from ODP web or manual input,
2. tell the user when to tap the NFC tag,
3. return a plain-language result first,
4. keep EV2, binding profiles, and writer tooling in an operator-only area.

## Guided user flow

The novice flow is intentionally sequential:

1. `Welcome`
2. `Get trusted setup`
3. `Review trusted values`
4. `Optional local passport file`
5. `Tap NFC now`
6. `Scan result`
7. `Technical details`

The app keeps explicit session state for the current step, so web handoff or share/open actions can land the user directly in the right place instead of merely filling fields on a long form.

## Operator area

The default guided flow does **not** open with:

- EV2 key inputs
- binding-profile controls
- manual file-number / offset / length fields
- URL-first writer tooling

Those controls live in `Operator tools`.

This keeps the novice path understandable while still preserving the current mirror-profile and issuer/operator workflows for field testing.

## Trusted setup intake

The app accepts:

- versioned Android handoff JSON
- `odpcompanion://import?...` deep links
- Android shared text
- local `.odpass`
- local `passport.json`

Trusted setup remains the same five ODP-side values:

- `passportId`
- `verifyUrl`
- `ndppCommitmentHash`
- `nfcPublicKey`
- `dataHash`

The optional local file step is only for recomputing canonical `dataHash` on-device. It is not required for a basic NFC scan.

## Explicit proof-method model

The Android app, web handoff, and docs now use an explicit proof-method vocabulary:

- `manufacturerOriginality`
- `ev2SessionAuth`
- `tagTamperState`
- `directComparableStoredKey`
- `trueChallengeResponse`

Important meaning:

- `manufacturerOriginality` means `Read_Sig` / NXP originality evidence. It helps show a genuine NXP chip family response, but it is **not** passport binding.
- `ev2SessionAuth` means the phone established an EV2-authenticated session. It is stronger than probe-only evidence, but still **not** passport binding by itself.
- `tagTamperState` means the authenticated tamper/seal state when the tag and access rights allow it.
- `directComparableStoredKey` means the app read authenticated bytes from a documented protected file and compared them directly with the on-chain `nfcPublicKey`.
- `trueChallengeResponse` means a real chip-native arbitrary challenge/response verified against the on-chain `nfcPublicKey`.

## NTAG 424 trust resolution

For the current ODP deployment and the evidence currently available in this repo, the app and docs now take the following honest position:

- the companion app **does** support real low-level NTAG 424 probing
- it **does** support EV2 session establishment when the operator provides the correct local AES key
- it **does** support authenticated follow-up reads like UID, file settings, TagTamper, and protected file reads
- it **does** support a defensible mirror-profile path where authenticated stored bytes are compared directly with on-chain `nfcPublicKey`
- it does **not** currently have a defensible end-to-end chip-native arbitrary challenge/response protocol for this deployment that can be verified against the on-chain `nfcPublicKey`

So the strongest honest production wording here is:

> For NTAG 424 DNA in this deployment, the documented mirror profile is the strongest honest deployable path. It is not the same thing as claiming a true chip-native challenge/response proof.

## Mirror profile

Current reference profile:

- profile id: `odp-ntag424-nfc-public-key-file-v1`
- file: protected StandardData file `0x03`
- offset: `0x000000`
- read mode: `FULL`
- comparison rule: the authenticated bytes must equal the on-chain `nfcPublicKey` byte-for-byte

This profile is meaningful only when:

1. the issuer really provisioned the tag that way,
2. the verifier loaded the correct expected `nfcPublicKey`,
3. the app performed authenticated reading from that documented file.

If that provisioning rule cannot be justified, the app must keep `chipKeyMatch` unavailable.

## Web handoff v2

The Android handoff metadata now carries two extra ideas:

1. `proof`
2. `route`

`proof` tells Android which proof method is primary and which supporting methods are relevant.

`route` tells Android which screen to open first, for example:

- `ready-to-scan` for normal verifier use from `verify.html`
- `advanced-operator` when `passport.html` is preparing a write/operator session

That means:

- novice users can open straight into the guided scan path
- operator/manage flows can still jump directly into the advanced branch

## Result wording rules

The app now separates these statements clearly:

- carrier opened
- public payload matched
- EV2 session authenticated
- TagTamper state observed
- direct comparable stored key matched
- true challenge-response not claimed here

The result screen always prefers plain language such as:

- what matched
- what this proves
- what this does not prove

Technical transcript cards remain available on the details screen.

## Build

Requirements:

- JDK 17
- Android SDK / platform tools with API 36
- Android SDK path configured via Android Studio, `ANDROID_HOME`, or `local.properties`

From the Android project root:

```bash
cd android-companion
./gradlew assembleDebug
```

## Current honest scope

Already real:

- guided multi-screen verifier UX
- versioned handoff import and routing
- explicit proof-method model in app state
- novice-first result wording
- operator-only EV2 / binding / writer controls
- low-level NTAG 424 probing
- `Read_Sig` originality extraction
- optional EV2 auth
- authenticated post-EV2 reads
- mirror-profile comparison path

Not claimed as complete here:

- backend-assisted key custody / HSM flow
- generic production-ready operator key management
- defensible NTAG 424 true challenge-response against the on-chain `nfcPublicKey`
- automatic on-chain fetch inside the Android app without web handoff
# Android companion app (`android-companion/`)

The Android verifier MVP now lives at `android-companion/` as a **separate temporary local Git repository inside this workspace**.

It is intended to become its own GitHub project. The main ODP repo keeps only the protocol, web, and integration documentation that explain how the companion app relates to the ODP flow.

It is intentionally a verifier-side NFC tool, not a full issuer workstation and not a hard dependency for the ODP web flow.

## Repo status and ownership

- `android-companion/` is the standalone Android project root.
- the parent ODP repo now treats it as an external local companion project rather than part of the main tracked deliverable
- this `docs/` file remains in the main repo so ODP contributors can see how the Android app fits into the protocol and web verifier flow
- publishing the Android app remotely later should happen from the `android-companion/` repo itself, with its own GitHub remote and issue history

## What the MVP does

The app currently provides:

- a real Android project with Gradle wrapper, Kotlin, and Jetpack Compose
- a visible in-app language switch with `System` / `English` / `Русский` override for field testing
- NFC reader mode for live tag scans
- versioned Android handoff import from ODP web helpers:
  - structured JSON text
  - `odpcompanion://import?handoff=...` deep links
  - Android share-target text intake
- URL-first carrier parsing for:
  - first record = GitHub-hosted ODP Verify URL
  - second record = raw `odp:off` payload bytes
- NDEF writing for the same URL-first carrier shape
- local canonical-data intake for:
  - `.odpass` bundles (reads `passport.json` from the ZIP)
  - raw `passport.json`
- SHA-256 comparison of the raw `odp:off` payload bytes against an expected `ndppCommitmentHash`
- compact `odpOffline` CBOR parsing for embedded:
  - `passportId`
  - `creatorId`
  - `title`
  - `objectType`
  - `verificationMethod`
  - `dataHash`
- explicit result states for:
  - `carrierRead`
  - `verifyUrlMatch`
  - `passportIdMatch`
  - `offlinePayloadMatch`
  - `chipAuth`
  - `tamperState`
  - `chipKeyMatch`
  - `embeddedDataHashMatch`
  - `canonicalDataHashMatch`
- explicit chip-provider evidence for:
  - staged placeholder path
  - real ISO-DEP low-level probe path
  - future authenticated low-level path
- public `Read_Sig` (`0x3C`) extraction of the NTAG 424 DNA originality signature
- best-effort in-app verification of that signature against NXP's published secp224r1 originality public key
- explicit report state showing that originality proof is adjacent chip evidence, not a direct `nfcPublicKey` match
- local EV2 auth configuration kept separate from ODP trust inputs:
  - auth key number
  - AES-128 key
  - optional `PCDCap2`
- optional authenticated chip-binding file configuration kept separate from both ODP trust inputs and EV2 auth inputs:
  - StandardData file number
  - offset
  - length
  - MAC/FULL read mode
  - whether the returned bytes are declared as a stored public key or only opaque live evidence

## Current reference first-link target

For the current reference deployment, the first carrier link is the GitHub-hosted Verify page:

```text
https://object-digital-passport.github.io/object-digital-passport/verify.html?id=ODP-...
```

That is the default first-link target used by the web export/share helpers in the main ODP repo and by the Android companion app MVP now.

`odp://...` remains the normative URI layer in `SPEC.md`, but switching the first-link target to `odp://` is deferred to stable v1, when resolver/app context is ready and reliable enough to replace the web-first fallback.

## Reference binding profile

The deployment blocker for a real `chipKeyMatch` is no longer "the Android app lacks a file read." It is now whether the tag was provisioned according to an explicit comparable profile.

Current concrete reference profile:

- profile id: `odp-ntag424-nfc-public-key-file-v1`
- label in Android UI: `ODP nfcPublicKey mirror v1`
- storage location: protected StandardData file `0x03`
- storage format: bytes at offset `0x000000` are exactly the same byte string published on-chain as ODP `nfcPublicKey`
- framing requirement: no TLV, CBOR, ASN.1/DER wrapper, or length prefix
- authenticated read mode: `FULL`
- read length: derived from the expected on-chain `nfcPublicKey` length loaded into the app

Under this profile, `chipKeyMatch` is meaningful because the app is comparing authenticated on-tag bytes against the exact same byte string the issuer published on-chain. If the deployment does not follow this profile, the app must keep `chipKeyMatch` unavailable unless another equally defensible directly comparable profile is documented.

The web handoff helper format can now optionally carry this metadata as:

```json
{
  "chipBinding": {
    "profileId": "odp-ntag424-nfc-public-key-file-v1"
  }
}
```

For the current Pixel pilot, the ODP web helper buttons now prefill that profile when the passport record exposes `nfcModel = NTAG424DNA_TAGTAMPER` together with `nfcPublicKey`. Other deployments should override or omit that field unless they really follow the same directly comparable protected-file profile.

## Current verifier workflow

1. Read the passport in ODP web / Verify and export a structured Android handoff, or copy the five trusted values manually if needed:
   - `Passport ID`
   - `Verify URL`
   - `ndppCommitmentHash`
   - `nfcPublicKey`
   - `dataHash`
2. Open that handoff in the Android companion app through:
   - the web helper buttons (`Copy`, `Share`, or `Open Android companion`)
   - an `odpcompanion://import?...` deep link
   - a shared JSON/text payload
3. Optionally import a local `.odpass` or raw `passport.json` so the app can hash canonical data locally instead of relying only on pasted values.
4. Tap the NFC tag with the phone.
5. Let the app:
   - read the carrier
   - compare the observed first-link URL with the expected Verify URL
   - compare the observed passport IDs from both the first-link URL and the parsed `odp:off` payload
   - extract the raw `odp:off` payload bytes
   - hash those raw bytes
   - compare with the expected NDPP anchor
   - compare embedded `dataHash` with the expected passport hash
   - compare imported canonical `passport.json` bytes with the expected `dataHash` when a local file is available
6. Read the result rows and observed-vs-expected evidence separately instead of collapsing everything into one "valid/invalid" answer.

## Pixel pilot protocol

Use this as the current practical field flow for the **guided** companion app:

1. Install the Android companion debug APK on a Pixel with NFC enabled.
2. In ODP web, use the Android helper buttons from `Verify` or `Manage passport` so the handoff carries the trusted values, proof metadata, route hint, and (for the current pilot deployment) the `odp-ntag424-nfc-public-key-file-v1` profile id.
3. Open that handoff in the Android app (`Open Android companion` / share / deep link). Confirm the app lands on the expected guided step:
   - `Verify` handoff → `Tap NFC now` when setup is complete
   - `Manage passport` handoff with offline payload → `Operator tools` when write/operator flow is intended
4. On `Welcome`, choose `Start guided check` unless you intentionally opened operator mode.
5. Walk the guided screens in order: `Get trusted setup` → `Review trusted values` → optional local `.odpass` / `passport.json` → `Tap NFC now`.
6. Tap the tag and read the plain-language result first. Open `Technical details` only if you need transcripts.
7. Confirm the proof-method wording stays honest:
   - manufacturer originality is not passport binding
   - EV2 auth is not passport binding by itself
   - `chipKeyMatch` is meaningful only under the documented mirror profile and direct byte comparison with on-chain `nfcPublicKey`
8. For EV2 or tag writing, enter `Operator tools`, fill local EV2 inputs if required, then scan or arm write mode from that branch only.

**Automated checks already run in CI/dev:** Kotlin compile, debug APK assembly, and `node --check web/odp-android-companion.js`. **Still device-only:** real NFC scan, deep-link app launch, and end-to-end wording on a physical Pixel.

## Chip-binding status

The project now has a more realistic provider architecture:

- `DefaultChipIdentityProvider` chooses the scan path
- `PlaceholderChipIdentityProvider` keeps the staged path explicit for NDEF-only scans
- `Ntag424LowLevelChipIdentityProvider` opens `IsoDep`, sends wrapped native commands, and records observed chip evidence from `GetVersion`
- `VerificationReportBuilder` keeps the trust model separated between:
  - carrier opened
  - offline payload matched
  - chip authenticated
  - tamper state
  - chip-key match
  - canonical passport verification

That means the app architecture is now prepared for:

- low-level NTAG 424 DNA authentication
- TagTamper state readout
- extraction of live chip public verification material
- comparison of that live chip key with on-chain `nfcPublicKey`

What is **already real** in the current low-level slice:

- a real `IsoDep` session when the tag exposes it
- wrapped native `GetVersion` (`0x60`) plus `AdditionalFrame` (`0xAF`) exchanges
- observed chip UID plus hardware/software/manufacturing bytes
- public `Read_Sig` (`0x3C`) extraction of the chip's 56-byte NXP originality signature
- best-effort in-app verification of that signature against NXP's published secp224r1 originality public key using the observed UID
- provider status, auth notes, tamper notes, and command transcript evidence in the UI
- optional `AuthenticateEV2First` part 1 / part 2 handling when the operator provides a valid local AES-128 key
- returned challenge verification plus session ENC/MAC key derivation for that EV2-authenticated session
- authenticated `GetFileSettings` (`0xF5`) as a first MAC-protected post-EV2 read
- authenticated `GetCardUID` (`0x51`) as live secure-session chip identity evidence
- authenticated `GetTTStatus` (`0xF7`) attempt with explicit returned TagTamper bytes when the tag/access rights allow it
- authenticated `ReadData` (`0xAD`) of a configured StandardData file after EV2 auth, so the app can surface live chip-binding bytes when the deployment stores them there
- named binding-profile selection in the UI, including `ODP nfcPublicKey mirror v1` as the concrete directly comparable reference profile
- separate UI evidence for adjacent public proof, EV2/session establishment, and authenticated post-EV2 reads

What is **not** complete yet in the Android repo, but is follow-up rather than a blocker for the current Pixel pilot:

- no native NTAG challenge-signing command has been implemented here that proves arbitrary challenge-response against on-chain `nfcPublicKey`
- no guarantee that a target deployment actually follows `odp-ntag424-nfc-public-key-file-v1` or another documented directly comparable profile; the new `ReadData` path is only directly comparable when the operator/issuer provisioned such a profile and configures it correctly
- treating NXP originality proof as passport binding; the app keeps that proof separate on purpose because it is only adjacent evidence
- end-to-end confidence around the broader protected command/file set beyond the first `GetFileSettings`, `GetCardUID`, and `GetTTStatus` slice
- full chip-to-passport proof
- production-grade operator key storage / provisioning beyond manual session input

The current low-level path should now be read in five honest states:

- probe only: real chip probing happened, but no EV2 auth was attempted
- public-proof extracted: `Read_Sig` returned an originality signature, optionally verified against NXP's published originality key, but that still is not the passport-specific `nfcPublicKey`
- EV2 attempted: `AuthenticateEV2First` was attempted, but the mutual-auth flow did not complete
- EV2 authenticated: `AuthenticateEV2First` completed and session keys were derived, and the app can now attempt authenticated `GetCardUID`, `GetFileSettings`, and `GetTTStatus`
- post-auth evidence collected: one or more authenticated follow-up reads returned evidence
- direct comparable bytes extracted: a configured authenticated `ReadData` file read returned live bytes from a protected StandardData file that the operator explicitly declared as the stored chip binding key

That means `chipAuth = PASS` still only refers to the EV2 mutual-auth step itself. `Read_Sig` can add manufacturer-level originality evidence, and authenticated follow-up reads can add UID or TagTamper evidence, but that still does **not** mean that chip-to-passport binding or canonical passport verification have already passed.

## EV2 auth boundary

The Android app now keeps two boundaries explicit:

- ODP trust inputs:
  - `passportId`
  - `Verify URL`
  - `ndppCommitmentHash`
  - `nfcPublicKey`
  - `dataHash`
- local EV2 operator inputs:
  - `keyNo`
  - AES-128 auth key
  - optional `PCDCap2`

Current assumptions for this MVP slice:

- if no local EV2 AES key is configured, the app stays in probe-only mode
- if a valid 16-byte AES key is configured, the app attempts `AuthenticateEV2First`
- those local EV2 inputs are app-session scaffolding only and are not exported as passport evidence
- after EV2 auth, the app now attempts a first authenticated MACed read and two FULL-mode follow-up reads for UID and TagTamper evidence
- if `odp-ntag424-nfc-public-key-file-v1` is selected, the app now attempts an authenticated `ReadData` against file `0x03` and compares the returned bytes with on-chain `nfcPublicKey` using the exact on-chain byte length
- if the operator uses a custom binding profile, the app only compares the returned bytes directly when that custom profile is explicitly treated as the stored chip public-key source
- `Read_Sig` originality evidence can now be extracted before EV2 auth, but it is verified against NXP's global originality key, not the passport's on-chain `nfcPublicKey`
- true challenge-response against the on-chain key family is still the remaining blocker whenever no defensible protected-file public-key source exists

## Relation to `AndroidCrypto/Ntag424SdmFeature`

The external `AndroidCrypto/Ntag424SdmFeature` project is relevant as a technical reference for:

- NTAG 424 DNA secure messaging ideas
- SDM / NDEF handling details
- `IsoDep` session usage
- wrapped native command framing
- `GetVersion` / additional-frame sequencing
- the future `AuthenticateEV2First` boundary

It does **not** define the architecture of this app.

The companion app keeps its architecture independent:

- ODP-specific UI and result states stay in the Android repo
- chip auth is behind an interface
- future low-level integrations can be swapped without rewriting the rest of the app
- ODP trust-state rows remain separate even while the low-level path becomes more capable

## Build and run

Requirements:

- JDK 17
- Android SDK / platform tools with API 36
- Android SDK location configured through Android Studio, `ANDROID_HOME`, or `local.properties` with `sdk.dir=...`
- Android Studio or a local Android command-line toolchain

From the Android repo root:

```bash
cd android-companion
./gradlew assembleDebug
```

Open in Android Studio if you want emulator/device deployment and UI inspection.

## What the MVP does not do yet

The current app does **not** yet:

- resolve on-chain passport data by itself
- fetch trusted values directly from ODP Verify without the handoff / share flow
- perform full low-level NTAG 424 DNA cryptographic authentication
- guarantee a meaningful TagTamper verdict on every target tag; failed or inconclusive `GetTTStatus` results stay explicit
- extract live chip-key proof material that is directly comparable to on-chain `nfcPublicKey`
- prove chip-to-passport binding without a future real chip-auth provider
- verify hosted `.odpass` bundles from the network inside the app

So the current MVP should be treated as:

- real NFC carrier read/write tooling
- real offline payload comparison tooling
- real ODP-specific result-state UI
- real low-level chip probing plus staged chip-binding architecture for the next integration step
