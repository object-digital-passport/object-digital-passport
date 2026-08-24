# Object Digital Passport — release notes · v0.6

*Plain-language summary of this version: [**v0.6 release note**](releases/v0.6.md). This page is the long-form detail behind it.*

*Reference implementation snapshot · protocol line **v0.6** (on-chain generation **6**, packed `CONTRACT_VERSION` = **6**). Deployed on **Polygon mainnet** (`chainId` 137) on **2026-07-24**. Narrative summary: [`V0.6.md`](V0.6.md); design rationale: [`REQUIREMENTS_FIELDS_V0.6.md`](ru/REQUIREMENTS_FIELDS_V0.6.md); full rules: `**[SPEC.md](../SPEC.md)`**.*

## Summary

**v0.6** is a ground-up redesign of what a passport stores and where, built around the **Object ID identification principle**. Every passport now carries a small, immutable **on-chain card** (`title`, `authorName`, `shortDescription`, `domain`); the scattered v0.5 fields for seals, extra images, materials, dimensions, and marks are replaced by a single extensible `anchors[]` array; and every previously overwritable current-state field is now an **append-only event**. This tag also includes the optional `**ODPAuthorAttestation`** satellite (EIP-712 author attestation, now deployed), a rewritten JSON Schema tracking the new shape, and a fully retranslated Russian `SPEC.md`.

---

## On-chain (protocol)

- **On-chain card:** `title`, `authorName`, `shortDescription`, `domain` written once at mint, with **no edit path** — a typo or renaming means revoke and re-mint. MUST match `passport.json` byte-for-byte; a verifier that finds any mismatch reports the passport as **tampered**, not merely changed.
- **Identification anchors:** a single `anchors[]` array (`photo`, `dimensions`, `materials`, `distinguishing_features`, `marks`, `file_hash`, `perceptual_hash`, `c2pa`, `nfc`, `numbered_seal`, `fingerprint`, `dna`, …) committed on-chain via `**anchorsHash`** + `**anchorTypesMask`**. A **hard identification minimum** is enforced at mint per `objectType`: physical objects need `photo` + `dimensions` + `materials` + `distinguishing_features`; digital objects need `file_hash`. A cryptographic seal (`nfc` / `numbered_seal`) is now **optional** on top of that minimum.
- **Append-only events:** `**recordPassportEvent`** replaces all v0.5 overwritable current-state setters — status, location, rights, condition, damage, restoration, or a custom note, each optionally anchoring a signed document by hash. The current value of any mutable aspect is simply the latest event of its kind.
- **`freeze()` restored:** the deployer-only, irreversible write-stop safety hatch existed through v0.4, was removed in the v0.5 line to fit the EIP-170 bytecode budget, and is back in v0.6.
- **Assurance tiers** (Base / Sealed / Attested): a display-layer summary of the SPEC §11 verification checks, computed at view time from current on-chain state — never stored on-chain, encoded into an ID, or printed on an object.
- **Canonical registry:** the deployed v0.6 registry is now the normative default target for unqualified `odp://` references (SPEC §7, §12.3, §19.2); other deployments must self-identify.
- **`ODPAuthorAttestation` satellite (new, deployed):** optional EIP-712 author attestation binding a separate author key to a passport's `dataHash` and `creatorId`, independent of the wallet that sent the mint transaction. Ships as a satellite specifically so the main registry bytecode is untouched — adopting it needed no re-deploy of the canonical registry, and the registry address did not move.

## Bytecode (EIP-170)

Removing six overwriting functions and a large slice of the struct more than pays for the new card and anchor fields: the main registry now compiles to **13,309 bytes** against the 24,576-byte limit — roughly half the budget free for future protocol work.

## Deployed addresses (Polygon mainnet, `chainId` 137)

| Contract | Address |
| --- | --- |
| Main registry `ObjectDigitalPassport` | [`0x012aC6393464A73EC16131D701ff2e000695b91b`](https://polygonscan.com/address/0x012aC6393464A73EC16131D701ff2e000695b91b) |
| Linked library `ODPPassportLib` | [`0xB7D7B8485eeb385c375ABd91035F5a6914171ccE`](https://polygonscan.com/address/0xB7D7B8485eeb385c375ABd91035F5a6914171ccE) |
| `ODPWalletDocumentAnchor` (satellite) | [`0x35df3773919D9F10e5F8838abaa453DE120e6Cb4`](https://polygonscan.com/address/0x35df3773919D9F10e5F8838abaa453DE120e6Cb4) |
| `ODPCounterfeitConcern` (satellite) | [`0x692935d6c1532b47cE0459bF1E9549991d0eD2C9`](https://polygonscan.com/address/0x692935d6c1532b47cE0459bF1E9549991d0eD2C9) |
| `ODPRegistryRelations` (satellite) | [`0x2ea6f05a050973afa14E61b1Ea19De92621e3661`](https://polygonscan.com/address/0x2ea6f05a050973afa14E61b1Ea19De92621e3661) |
| `ODPPassportProofRegistry` (satellite) | [`0x990FCc2E587d9f2cDb9c73083E9f90793CeF7F49`](https://polygonscan.com/address/0x990FCc2E587d9f2cDb9c73083E9f90793CeF7F49) |
| `ODPExtensionMintRouter` (satellite) | [`0x3fa8f213399a2A9f7Da4bF7D8a9D7D42E8AEF822`](https://polygonscan.com/address/0x3fa8f213399a2A9f7Da4bF7D8a9D7D42E8AEF822) |
| `ODPAuthorAttestation` (satellite) | [`0x1972E68D0A5B19C5ee2af54F8b792c426985F7d7`](https://polygonscan.com/address/0x1972E68D0A5B19C5ee2af54F8b792c426985F7d7) |

The author-attestation satellite's EIP-712 domain separator is `0x6ad8954a8660debd479bf96c0362aee94b5297e61a46d121d49cb7981e109788` — signing clients should arrive at the same value from domain `{ name: "Object Digital Passport", version: "1", chainId: 137, verifyingContract: "0x1972E68D0A5B19C5ee2af54F8b792c426985F7d7" }`.

**Previous line (v0.5, superseded):** [`0x413aEeBB2ac437483Bc68791EaAab492C2a4B346`](https://polygonscan.com/address/0x413aEeBB2ac437483Bc68791EaAab492C2a4B346) stays readable — Verify still resolves v0.5 passports via `previousContracts` — but is not where new passports are issued.

---

## Docs, schema & localization

- **`schema/passport-0.6.schema.json`** replaces the v0.5 schema as the one CI validates against; examples rewritten to the v0.6 shape (card fields + `anchors[]`), with `allOf`/`contains` rules enforcing the same hard identification minimum the contract enforces.
- **`docs/SECURITY.md`** (and the Russian mirror) rewritten for the v0.6 threat model, including a static-analysis (Slither) findings triage table.
- **`ru/SPEC.md`** fully retranslated, section by section, to track the v0.6 English `SPEC.md` — it had been stuck describing the v0.5 shape.
- **`CHANGELOG.md`** added at the repository root (Keep a Changelog format), covering every tagged release plus this line.

## What moved where (v0.5 → v0.6)

| v0.5 | v0.6 |
| --- | --- |
| numeric profile ID only, on-chain | + on-chain card: `title`, `authorName`, `shortDescription`, `domain` |
| `sealType` / `sealHash` / `nfcPublicKey` / `nfcModel` | `nfc` / `numbered_seal` anchors |
| `imageHash2/3`, `imageUrl2/3` | `photo` anchors (no fixed limit) |
| `currentState.*` + four overwriting setters | append-only `recordPassportEvent` |
| `auxCommitment*` (COA pointer) | attestation `documentHash`, or a document anchor |
| `ndppCommitment*` | offline carriers verify against `dataHash` / `anchorsHash` directly |
| `physical.seal` / `image` / `images` in JSON | `anchors[]` |

Profiles (C/B/P/M), monthly mint caps, mint-agent delegation, the relations / proof / counterfeit-concern satellites, revocation, ownership transfer, and URL updates are unchanged in model.

---

## See also

- **v0.6 narrative:** [`V0.6.md`](V0.6.md)
- **Design rationale / field tables:** [`REQUIREMENTS_FIELDS_V0.6.md`](ru/REQUIREMENTS_FIELDS_V0.6.md)
- **Full deployment table & terms:** [`GUIDE.md`](GUIDE.md#current-release)
- **Changelog:** [`../CHANGELOG.md`](../CHANGELOG.md)
- **Versioning & tags:** [`VERSIONING_AND_RELEASES.md`](VERSIONING_AND_RELEASES.md)
- **Previous line (v0.4.1):** [`RELEASE_v0.4.1.md`](RELEASE_v0.4.1.md)

---

*When you publish git tag `**v0.6`**, attach these notes or link this file in the GitHub Release.*
