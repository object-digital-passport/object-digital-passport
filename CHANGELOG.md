# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/) — the six change types only, with the optional per-release summary that 2.0.0 introduced. Versioning here follows the project's own model rather than plain SemVer: each `v0.x` is a **separate on-chain registry generation** (packed `CONTRACT_VERSION`), not backward compatible with the previous one — see [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md) and `SPEC.md`. Patch tags (e.g. `v0.4.1`) are reserved for tooling/docs-only fixes that do not change the deployed registry.

This file is drafted from commit history and existing release notes; entries are curated, not auto-generated — corrections welcome.

## [0.7] - Unreleased

Edition passports and per-unit activation keys — one passport for a production run of up to
millions of items, with a key under a scratch layer on each one. Contracts and tests are done;
no issuer tooling or buyer-facing activation page exists yet. Decisions are recorded in
[`docs/EDITION_UNIT_KEYS.md`](docs/EDITION_UNIT_KEYS.md) §10 and eleven ADRs under
[`docs/adr/`](docs/adr/); normative rules are `SPEC.md` §20.

### Added

- **Edition passports** (`B` profiles only): one passport per production run carrying a Merkle root over every unit's key, so 100 000 units cost 32 bytes on-chain.
- **`ODPEditionUnits` satellite**: `openEdition`, permissionless `activate` authenticated by a unit-key signature rather than `msg.sender`, and `mintUnitPassport` for a lazily minted per-unit passport.
- **Four core hooks**: explicit `initialOwner` at mint, a one-way revocation lock the satellite sets on first activation, event kind 8 (edition notice), and a mint path authorised by a unit-key signature.
- **Optional signed outer labels** with the signer key published on-chain, verifiable offline.
- **Known-answer vectors** (`schema/vectors/edition-units.json`) asserted against Solidity, plus `schema/passport-0.7.schema.json`.

### Changed

- Packed `CONTRACT_VERSION` = **7**; `PassportMintInputs` gains `initialOwner`.
- Code entropy floor is per-target: `≥ 80 + ceil(log2(unitCount))` bits.
- The unit address list must travel in the `.odpass` bundle, not only at a URL.

## [0.6] - 2026-07-24

On-chain generation 6, deployed to Polygon mainnet. The storage-model redesign. Friendly summary: [release note](docs/releases/v0.6.md).

### Added

- **v0.6 on-chain card**: `title`, `authorName`, `shortDescription`, `domain` written once at mint, immutable, checked byte-for-byte against `passport.json` (SPEC §8, §9).
- **v0.6 identification anchors**: a single extensible `anchors[]` array in `passport.json` (`photo`, `dimensions`, `materials`, `distinguishing_features`, `marks`, `file_hash`, `perceptual_hash`, `c2pa`, `nfc`, `numbered_seal`, `fingerprint`, `dna`, …), committed on-chain via `anchorsHash` + `anchorTypesMask`. A hard identification minimum is enforced at mint per `objectType` (docs/V0.6.md).
- **v0.6 append-only passport events** (`recordPassportEvent`): status, location, rights, condition, damage, restoration, or a custom note — each optionally anchoring a signed document by hash.
- **`freeze()` restored** in v0.6 (deployer-only, irreversible write-stop safety hatch). It existed through v0.4, was removed in the v0.5 line to fit the EIP-170 bytecode budget, and is back in v0.6; planned for removal again in stable v1.
- **`ODPAuthorAttestation` satellite**: optional EIP-712 author attestation binding a separate author key to a passport's `dataHash` and `creatorId`, independent of the minting wallet. Ships as a satellite so the main registry bytecode is untouched. Deployed on Polygon mainnet at `0x1972E68D0A5B19C5ee2af54F8b792c426985F7d7`; the canonical registry address did not change.
- **Assurance tiers** (Base / Sealed / Attested): a display-layer summary of SPEC §11 verification checks, computed at view time from current on-chain state — never stored on-chain, encoded into an ID, or printed on an object (SPEC §11).
- **Canonical registry** (SPEC §7, §12.3, §19.2): the deployed v0.6 registry is now the normative default target for unqualified `odp://` references; other deployments must self-identify.
- **`schema/passport-0.6.schema.json`**: JSON Schema for the v0.6 `passport.json` shape, with `allOf`/`contains` rules enforcing the hard identification minimum; examples rewritten to match (`schema/examples/*.json`).
- **v0.5 object model** (superseded by v0.6 above where noted): `physical` / `digital` / `mixed` `objectType`, `contentClass` / `aiStatus` / `verificationMethod` / `edition` classification axis.
- **v0.5 compact `odpOffline v0.1` payload** for QR/NFC carrier scenarios (removed again in v0.6 — see Removed).

### Changed

- **`documentHash` / `documentUrl`** field naming on Proof records (was `noteHash` / `noteUrl` in v0.5).
- **`docs/SECURITY.md`** (and the Russian mirror) rewritten for the v0.6 threat model, including a static-analysis (Slither) findings triage table.
- **Russian `SPEC.md` translation** (`web/frontend/localization/ru/SPEC.md`) fully retranslated section-by-section to track the v0.6 English `SPEC.md` (was stuck at the v0.5 shape).

### Removed

- v0.5 `sealType` / `sealHash` / `nfcPublicKey` / `nfcModel` on-chain fields → `nfc` / `numbered_seal` anchors.
- v0.5 `imageHash2` / `imageHash3`, `imageUrl2` / `imageUrl3` → `photo` anchors (no fixed limit).
- v0.5 `currentState.*` and its overwriting setters → append-only `recordPassportEvent`.
- v0.5 `auxCommitment*` → attestation `documentHash`, or a document anchor.
- v0.5 `ndppCommitment*` / the compact `odpOffline` payload → offline carriers now verify directly against `dataHash` / `anchorsHash`.

## [0.5] - 2026-05-12

On-chain generation 5, deployed to Polygon mainnet and **never tagged**. Registry
[`0x413aEeBB2ac437483Bc68791EaAab492C2a4B346`](https://polygonscan.com/address/0x413aEeBB2ac437483Bc68791EaAab492C2a4B346).
The date is when the address was first recorded in this repository; the deployment itself is not
dated anywhere. No GitHub Release was published because the mutable current-state model below
was already scheduled for removal: every current-state field it added was replaced by
append-only events in 0.6, since a record that can be overwritten is worth what its last writer
says it is. See [the release note](docs/releases/v0.5.md).

### Added

- Mutable on-chain current-state fields — status, location, rights note, condition note, damage-history pointer — updatable after mint without re-minting.
- Object model built around `physical` / `digital` / `mixed`, with `objectType`, `contentClass`, and refinement tags.
- Compact offline payload (`ndppCommitment*`, `odpOffline`) for printed and NFC carriers.

### Removed

- **`freeze()`**, the deployer-only irreversible write-stop, dropped to fit the registry inside the EIP-170 bytecode limit after the surfaces were split. It existed through v0.4 and is restored in v0.6, so the v0.5 registry is the only line with no on-chain way to stop writes.

## [0.4.1] - 2026-04-05

Patch release: tooling and community-workflow fixes, no protocol change (still packed `CONTRACT_VERSION = 4`). Full notes: [GitHub Release](https://github.com/object-digital-passport/object-digital-passport/releases/tag/v0.4.1).

### Added

- New **Standard gap** issue template — propose what is missing or unclear in `SPEC.md`.

### Changed

- **Subresource Integrity (SRI)** on third-party CDN scripts (`ethers`, QR libraries, `html2canvas`, `jszip`, `jsQR`) on the creator, passport, and verify pages.
- On-chain error text rendered via `textContent`, not concatenated into `innerHTML`.
- Root `package.json`: Hardhat 3.x, `@nomicfoundation/hardhat-toolbox-mocha-ethers`, dotenv 17.x, npm overrides for known transitive advisories.
- `chain/types/ethers-contracts/`: committed generated TypeScript typings and factories.

### Removed

- Extra advanced CodeQL workflow (conflicted with GitHub default Code scanning's SARIF upload).

### Security

- Findings inside the generated WalletConnect bundle (`web/odp-wallet-wc.bundle.js`) dismissed as won't-fix (build output from npm dependencies, not hand-maintained source).

## [0.4] - 2026-04-05

On-chain generation 4. Full notes: [GitHub Release](https://github.com/object-digital-passport/object-digital-passport/releases/tag/v0.4).

### Added

- Optional **`ODPCounterfeitConcern`** satellite (P/M profiles only): `raiseCounterfeitConcern`, `clearCounterfeitConcern`, `getCounterfeitConcern`.
- **UTC calendar enforcement** for `ODP-YYYY-MM-…` / `PRF-YYYY-MM-…` prefixes: `year`/`month` arguments to mint and `submitProof` must match the Gregorian UTC month of `block.timestamp` (`ODPPassportLib.utcYearMonthFromTimestamp`; mismatch reverts `EC(68)`).
- WalletConnect v2 session restore on Profile / Passport pages.
- Verify: P-affiliation on-chain audit (read-only parent + join/detach timestamps).

### Fixed

- **Registry correction**: an earlier v0.4 build only range-checked `year`/`month` on mint, allowing an arbitrary calendar pair in the human-readable prefix regardless of the actual mint month. That early deployment was frozen before being treated as stable; the fix landed before the line shipped for production use, so the protocol line stayed `v0.4` rather than bumping to `v0.5` solely for this fix.

## [0.3] - 2026-03-29

On-chain generation 3. Full notes: [GitHub Release](https://github.com/object-digital-passport/object-digital-passport/releases/tag/v0.3).

### Added

- Passport ownership and transfer (`transferPassport`).
- Account-scoped publishing agent (`delegateCreatorPublishing` / `revokeCreatorPublishing`).
- Irreversible passport revocation (`revokePassport`).
- Single-address governance (`transferGovernance`).
- Up to three on-chain image hashes; optional `auxCommitmentHash` / `auxCommitmentUri`.
- Extension mints (`mintDigitalViaExtension`, `mintPhysicalViaExtension`) with `ExtensionMintUsed`.
- P-affiliation lifecycle (detach on passport UI; propose/confirm on profile).
- Optional DID document export.
- Separate `ODPWalletDocumentAnchor` contract for wallet-level file SHA-256 anchoring (deployed after the main registry).

### Changed

- Heavy `pure` validation logic moved to a linked library, `ODPPassportLib`, so the registry stays under the EIP-170 24 KiB creation limit.

### Removed

- `resolvePassport`, `getProofsForPassportPaged`, `attestExternalDocument` / `getExternalDocumentAttestation` on the main contract (moved to satellites), the on-chain counterfeit-concern registry (removed pending a future replacement), and long `P`-type `require` strings (replaced by `EC(71)`).

## [0.2] - 2026-03-27

On-chain generation 2. Full notes: [GitHub Release](https://github.com/object-digital-passport/object-digital-passport/releases/tag/v0.2).

### Added

- `updatePassportUrls` — set, change, or clear the public `dataUrl` after mint without changing `dataHash`.
- Monthly mint caps (anti-spam, gas-only): `C` ≈ 1,000, `B` ≈ 100,000, `P` unlimited per calendar month per wallet.

### Changed

- Register/mint/proof are gas-only — no separate protocol fee.
- `dataUrl` is optional at mint.
- Passport JSON ID field renamed to `passportId` (contract ABI wire name remained `humanId` for compatibility).

## [0.1] - 2026-03-22

First tagged release of the reference implementation: specification, Solidity contract, static web UI, and helper tooling. Full notes: [GitHub Release](https://github.com/object-digital-passport/object-digital-passport/releases/tag/v0.1).

### Added

- Initial `ObjectDigitalPassport.sol` contract deployed on Polygon PoS mainnet.
- Static web UI: `creator.html`, `passport.html`, `verify.html`.
- Hardhat deploy scripts and CLI minting tool.

[0.7]: https://github.com/object-digital-passport/object-digital-passport/compare/v0.6...v0.7
[0.6]: https://github.com/object-digital-passport/object-digital-passport/compare/v0.4.1...v0.6
[0.5]: https://github.com/object-digital-passport/object-digital-passport/compare/v0.4.1...v0.6
[0.4.1]: https://github.com/object-digital-passport/object-digital-passport/compare/v0.4...v0.4.1
[0.4]: https://github.com/object-digital-passport/object-digital-passport/compare/v0.3...v0.4
[0.3]: https://github.com/object-digital-passport/object-digital-passport/compare/v0.2...v0.3
[0.2]: https://github.com/object-digital-passport/object-digital-passport/compare/v0.1...v0.2
[0.1]: https://github.com/object-digital-passport/object-digital-passport/releases/tag/v0.1
