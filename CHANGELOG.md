# Changelog

All notable changes to this project will be documented in this file. Russian translation: [`docs/ru/CHANGELOG.md`](docs/ru/CHANGELOG.md).

The format is based on [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/) — the six change types only, with the optional per-release summary that 2.0.0 introduced. Versioning here follows the project's own model rather than plain SemVer: each `v0.x` is a **separate on-chain registry generation** (packed `CONTRACT_VERSION`), not backward compatible with the previous one. **The versioned interface is the registry ABI plus the `passport.json` schema** — a new `v0.x` may change either, and passports do not migrate between generations. **Dates are the day a version became usable**: the mainnet deployment date for a protocol line, the GitHub Release date for a tooling-only patch — see [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md) and `SPEC.md`. Patch tags (e.g. `v0.4.1`) are reserved for tooling/docs-only fixes that do not change the deployed registry.

This file is drafted from commit history and existing release notes; entries are curated, not auto-generated — corrections welcome.

Entries up to and including 0.6 cover the protocol **and** the reference website, which shared
one repository until the 0.7 line. The website now has [its own
repository](https://github.com/object-digital-passport/object-digital-passport.github.io) and
its own history; what is recorded here from now on is the protocol.

## [Unreleased]

### Fixed

- The **advanced CodeQL workflow is removed again**. It has failed on every run since it was added — GitHub rejects the upload when Default code scanning is enabled, so the job ran the full analysis and produced no alerts, on `main` as well as on pull requests. The same workflow was removed for the same reason in v0.4.1; the `paths-ignore` that justified reintroducing it pointed at a bundle that left with the website. Code scanning runs from Default setup, which covers JavaScript/TypeScript, Python **and** GitHub Actions. Recorded in [`docs/SECURITY.md`](docs/SECURITY.md#code-scanning-codeql) so it does not return a third time.

### Changed

- The **organization profile README** is rewritten against the repository as it is, and its repository-relative links are checked by CI — it described the pre-0.7 layout, listed two of four repositories, and linked a file that does not exist.
- **Branch protection is committed configuration** rather than a description of what to click: two importable rulesets under [`.github/rulesets/`](.github/rulesets/).
- CI checkouts no longer persist the job token into `.git/config`.

### Added

- [`docs/ORG_NAMING_AND_SITE.md`](docs/ORG_NAMING_AND_SITE.md) — a proposal, applied nowhere: repository names in the c2pa-org style, what each rename would break, and why `odp.github.io` cannot be obtained.

## [0.7] - 2026-08-22 — pre-release

**Not deployed.** No v0.7 registry exists on any network, so nothing can be registered against this line yet; the date is the pre-release tag, not a deployment. Edition passports and per-unit activation keys: one passport for a production run, with a key under a scratch layer on each item. Contracts and tests are done, no issuer tooling or activation page exists. Rationale in [`docs/EDITION_UNIT_KEYS.md`](docs/EDITION_UNIT_KEYS.md) and eleven records under [`docs/adr/`](docs/adr/).

### Added

- **Edition passports** (`B` profiles only): one passport per production run carrying a Merkle root over every unit's key, so 100 000 units cost 32 bytes on-chain.
- **`ODPEditionUnits` satellite**: `openEdition`, permissionless `activate` authenticated by a unit-key signature rather than `msg.sender`, and `mintUnitPassport` for a lazily minted per-unit passport.
- **Four core hooks**: explicit `initialOwner` at mint, a one-way revocation lock the satellite sets on first activation, event kind 8 (edition notice), and a mint path authorised by a unit-key signature.
- **Optional signed outer labels** with the signer key published on-chain, verifiable offline.
- **Known-answer vectors** (`schema/vectors/edition-units.json`) asserted against Solidity, plus `schema/passport-0.7.schema.json`.

### Changed

- **Breaking:** packed `CONTRACT_VERSION` = **7**. A separate registry from v0.6; passports do not migrate. `PassportMintInputs` gains `initialOwner`.
- **Breaking:** the reference website moved to [its own repository](https://github.com/object-digital-passport/object-digital-passport.github.io) and now publishes at <https://object-digital-passport.github.io/>. Every previous address redirects, query string intact. This repository is the protocol: specification, contracts, schema, vectors.
- No hostname is printed on an object (§12.2). The QR carries the `odp://` URI and the readable Passport ID; a website address is one implementation's convenience and was removed from the normative minimum.
- Code entropy floor is per-target: `≥ 80 + ceil(log2(unitCount))` bits, since a forger needs any valid code at any index and the address list is public.
- The unit address list must travel in the `.odpass` bundle, not only at a URL — a proof, and therefore activation itself, is impossible without it.
- Russian translations moved from the website's tree to [`docs/ru/`](docs/ru/); a translation of the standard belongs with the standard.
- `CHANGELOG.md` and every release note were rewritten: one template, one home under [`docs/releases/`](docs/releases/), and a linter that enforces the jargon rules.

### Fixed

- 27 dead relative links across the documentation, and a `dependabot.yml` that watched three directories containing no manifest — which is why npm version updates had never run.
- Both JSON Schema `$id`s pointed at a URL that had never resolved; they now match where the schema is published.
- The published specification site shipped the 0.5 schema under a page titled v0.5 while CI validated 0.6.

### Security

- Cleared the alert backlog: `axios` to ≥1.18.0 and `js-yaml` to ≥4.3.1 through `overrides`, with `elliptic` dismissed as no patch exists. Nothing vulnerable ever shipped — `axios` is absent from the built bundle — but the noise was hiding real findings.
- CodeQL runs from a checked-in configuration that excludes the generated WalletConnect bundle, so thirteen unfixable alerts against third-party build output stop recurring.

## [0.6] - 2026-07-24

On-chain generation 6, deployed to Polygon mainnet. The storage-model redesign. Friendly summary: [release note](docs/releases/v0.6.md).

### Added

- **v0.6 on-chain card**: `title`, `authorName`, `shortDescription`, `domain` written once at mint, immutable, checked byte-for-byte against `passport.json` (SPEC §8, §9).
- **v0.6 identification anchors**: a single extensible `anchors[]` array in `passport.json` (`photo`, `dimensions`, `materials`, `distinguishing_features`, `marks`, `file_hash`, `perceptual_hash`, `c2pa`, `nfc`, `numbered_seal`, `fingerprint`, `dna`, …), committed on-chain via `anchorsHash` + `anchorTypesMask`. A hard identification minimum is enforced at mint per `objectType` (docs/V0.6.md).
- **v0.6 append-only passport events** (`recordPassportEvent`): status, location, rights, condition, damage, restoration, or a custom note — each optionally anchoring a signed document by hash.
- **`freeze()` restored** (deployer-only, irreversible write-stop safety hatch). It existed through v0.4 and was dropped in the v0.5 line to fit the EIP-170 bytecode budget, leaving that registry with no on-chain way to stop writes.
- **`ODPAuthorAttestation` satellite**: optional EIP-712 author attestation binding a separate author key to a passport's `dataHash` and `creatorId`, independent of the minting wallet. Ships as a satellite so the main registry bytecode is untouched. Deployed on Polygon mainnet at `0x1972E68D0A5B19C5ee2af54F8b792c426985F7d7`; the canonical registry address did not change.
- **Assurance tiers** (Base / Sealed / Attested): a display-layer summary of SPEC §11 verification checks, computed at view time from current on-chain state — never stored on-chain, encoded into an ID, or printed on an object (SPEC §11).
- **Canonical registry** (SPEC §7, §12.3, §19.2): the deployed v0.6 registry is now the normative default target for unqualified `odp://` references; other deployments must self-identify.
- **`schema/passport-0.6.schema.json`**: JSON Schema for the v0.6 `passport.json` shape, with `allOf`/`contains` rules enforcing the hard identification minimum; examples rewritten to match (`schema/examples/*.json`).

### Changed

- **Breaking:** packed `CONTRACT_VERSION` = **6**. A separate registry from v0.5 — passports do not migrate, and both the ABI and the `passport.json` schema changed.
- **`documentHash` / `documentUrl`** field naming on Proof records (was `noteHash` / `noteUrl` in v0.5).
- **`docs/SECURITY.md`** (and the Russian mirror) rewritten for the v0.6 threat model, including a static-analysis (Slither) findings triage table.
- **Russian `SPEC.md` translation** (`docs/ru/SPEC.md`) fully retranslated section-by-section to track the v0.6 English `SPEC.md` (was stuck at the v0.5 shape).

### Deprecated

- **`freeze()`** — kept in this line as an alpha-era safety hatch and **planned for removal in stable v1**, where a registry must live without any privileged switch.

### Removed

- **Breaking:** v0.5 `sealType` / `sealHash` / `nfcPublicKey` / `nfcModel` on-chain fields → `nfc` / `numbered_seal` anchors.
- v0.5 `imageHash2` / `imageHash3`, `imageUrl2` / `imageUrl3` → `photo` anchors (no fixed limit).
- v0.5 `currentState.*` and its overwriting setters → append-only `recordPassportEvent`.
- v0.5 `auxCommitment*` → attestation `documentHash`, or a document anchor.
- v0.5 `ndppCommitment*` / the compact `odpOffline` payload → offline carriers now verify directly against `dataHash` / `anchorsHash`.

## [0.5] - 2026-05-12

Deployed to Polygon mainnet and **never tagged** — the mutable current-state model it introduced was already scheduled for removal, and 0.6 replaced it with append-only events. Registry [`0x413aEeBB…2a4B346`](https://polygonscan.com/address/0x413aEeBB2ac437483Bc68791EaAab492C2a4B346); the date is when that address was first recorded here, as the deployment itself is undated. Why it was not released: [the v0.5 note](docs/releases/v0.5.md).

### Added

- Mutable on-chain current-state fields — status, location, rights note, condition note, damage-history pointer — updatable after mint without re-minting.
- Object model built around `physical` / `digital` / `mixed`, with `objectType`, `contentClass`, and refinement tags.
- Compact offline payload (`ndppCommitment*`, `odpOffline`) for printed and NFC carriers.

### Changed

- **Breaking:** packed `CONTRACT_VERSION` = **5**. A separate registry from v0.4; passports do not migrate.

### Removed

- **Breaking:** **`freeze()`**, the deployer-only irreversible write-stop, dropped to fit the registry inside the EIP-170 bytecode limit after the surfaces were split. It existed through v0.4 and is restored in v0.6, so the v0.5 registry is the only line with no on-chain way to stop writes.

## [0.4.1] - 2026-04-05

Patch release: tooling and community-workflow fixes, no protocol change (still packed `CONTRACT_VERSION = 4`). Full notes: [GitHub Release](https://github.com/object-digital-passport/specifications/releases/tag/v0.4.1).

### Added

- New **Standard gap** issue template — propose what is missing or unclear in `SPEC.md`.

### Changed

- Root `package.json`: Hardhat 3.x, `@nomicfoundation/hardhat-toolbox-mocha-ethers`, dotenv 17.x.
- `chain/types/ethers-contracts/`: committed generated TypeScript typings and factories.

### Removed

- Extra advanced CodeQL workflow (conflicted with GitHub default Code scanning's SARIF upload).

### Security

- **Subresource Integrity (SRI)** on third-party CDN scripts (`ethers`, QR libraries, `html2canvas`, `jszip`, `jsQR`) on the creator, passport, and verify pages — a tampered CDN copy is now refused by the browser instead of executed.
- On-chain error text rendered via `textContent` rather than concatenated into `innerHTML`, closing a cross-site scripting path from contract-supplied strings.
- npm `overrides` pinning known transitive advisories out of the dependency tree.

Static-analysis findings inside the generated WalletConnect bundle (`web/backend/js/odp-wallet-wc.bundle.js`) were triaged as won't-fix — build output from npm dependencies, not hand-maintained source. That is a triage decision, not a change; it is recorded here because the scan report is public.

## [0.4] - 2026-04-05

On-chain generation 4. Full notes: [GitHub Release](https://github.com/object-digital-passport/specifications/releases/tag/v0.4).

### Added

- Optional **`ODPCounterfeitConcern`** satellite (P/M profiles only): `raiseCounterfeitConcern`, `clearCounterfeitConcern`, `getCounterfeitConcern`.
- `ODPPassportLib.utcYearMonthFromTimestamp` — the shared helper the registry and `submitProof` use to derive the UTC calendar month (the enforcement it enables is under Fixed).
- WalletConnect v2 session restore on Profile / Passport pages.
- Verify: P-affiliation on-chain audit (read-only parent + join/detach timestamps).

### Changed

- **Breaking:** packed `CONTRACT_VERSION` = **4**. A separate registry from v0.3; passports do not migrate.

### Fixed

- **Registry correction**: an earlier v0.4 build only range-checked `year`/`month` on mint, allowing an arbitrary calendar pair in the human-readable prefix regardless of the actual mint month. That early deployment was frozen before being treated as stable; the fix landed before the line shipped for production use, so the protocol line stayed `v0.4` rather than bumping to `v0.5` solely for this fix.

## [0.3] - 2026-03-29

On-chain generation 3. Full notes: [GitHub Release](https://github.com/object-digital-passport/specifications/releases/tag/v0.3).

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

- **Breaking:** packed `CONTRACT_VERSION` = **3**. A separate registry from v0.2; passports do not migrate.
- Heavy `pure` validation logic moved to a linked library, `ODPPassportLib`, so the registry stays under the EIP-170 24 KiB creation limit.

### Removed

- `resolvePassport`, `getProofsForPassportPaged`, `attestExternalDocument` / `getExternalDocumentAttestation` on the main contract (moved to satellites), the on-chain counterfeit-concern registry (removed pending a future replacement), and long `P`-type `require` strings (replaced by `EC(71)`).

## [0.2] - 2026-03-27

On-chain generation 2. Full notes: [GitHub Release](https://github.com/object-digital-passport/specifications/releases/tag/v0.2).

### Added

- `updatePassportUrls` — set, change, or clear the public `dataUrl` after mint without changing `dataHash`.
- Monthly mint caps (anti-spam, gas-only): `C` ≈ 1,000, `B` ≈ 100,000, `P` unlimited per calendar month per wallet.

### Changed

- **Breaking:** packed `CONTRACT_VERSION` = **2**. A separate registry from v0.1; passports do not migrate.
- Register/mint/proof are gas-only — no separate protocol fee.
- `dataUrl` is optional at mint.
- Passport JSON ID field renamed to `passportId` (contract ABI wire name remained `humanId` for compatibility).

## [0.1] - 2026-03-22

First tagged release of the reference implementation: specification, Solidity contract, static web UI, and helper tooling. Full notes: [GitHub Release](https://github.com/object-digital-passport/specifications/releases/tag/v0.1).

### Added

- Initial `ObjectDigitalPassport.sol` contract deployed on Polygon PoS mainnet.
- Static web UI: `creator.html`, `passport.html`, `verify.html`.
- Hardhat deploy scripts and CLI minting tool.

[Unreleased]: https://github.com/object-digital-passport/specifications/compare/v0.7...HEAD
[0.7]: https://github.com/object-digital-passport/specifications/compare/v0.6...v0.7
[0.6]: https://github.com/object-digital-passport/specifications/compare/v0.5...v0.6
[0.5]: https://github.com/object-digital-passport/specifications/compare/v0.4.1...v0.5
[0.4.1]: https://github.com/object-digital-passport/specifications/compare/v0.4...v0.4.1
[0.4]: https://github.com/object-digital-passport/specifications/compare/v0.3...v0.4
[0.3]: https://github.com/object-digital-passport/specifications/compare/v0.2...v0.3
[0.2]: https://github.com/object-digital-passport/specifications/compare/v0.1...v0.2
[0.1]: https://github.com/object-digital-passport/specifications/releases/tag/v0.1
