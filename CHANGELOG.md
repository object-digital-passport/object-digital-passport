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

- **The 0.7 line is now stated consistently across the specification, the schema and the contracts.** `SPEC.md` required `version: "0.6"` in §9 while §14 and `schema/passport-0.7.schema.json` required `"0.7"`, and §8 described the `Passport` struct as packing `contractVersion` **6** while `ObjectDigitalPassport.sol` compiles `SPEC_MAJOR = 0`, `SPEC_MINOR = 7` — an implementer following one section produced a document the other rejects. Every version claim in `SPEC.md`, `docs/ru/SPEC.md` and the canonical examples now reads 0.7. Nothing caught this because the 0.7 example corpus held a single file; it now holds four.
- **`did:odp` no longer reads as DID support** ([`SPEC.md` §18.2](SPEC.md), §19.3). `odp` is not a registered DID method — no method specification, no resolver, no entry in the W3C DID Specification Registries — so software requiring a resolvable DID cannot consume the string. The section now says so first and describes the strings as a naming convention, which is what they are.
- **§7 no longer presents v0.6 addresses as this line's canonical registry.** The canonical table is explicitly empty until a v0.7 registry is deployed, the v0.6 and v0.5 addresses move to a *Superseded lines* table, and the three places that told a client to fall back to "the canonical registry of §7" (§12.3, §19.2, §19.4) now say what to do when that table is empty.
- The **advanced CodeQL workflow is removed again**. It has failed on every run since it was added — GitHub rejects the upload when Default code scanning is enabled, so the job ran the full analysis and produced no alerts, on `main` as well as on pull requests. The same workflow was removed for the same reason in v0.4.1; the `paths-ignore` that justified reintroducing it pointed at a bundle that left with the website. Code scanning runs from Default setup, which covers JavaScript/TypeScript, Python **and** GitHub Actions. Recorded in [`docs/SECURITY.md`](docs/SECURITY.md#code-scanning-codeql) so it does not return a third time.
- **The spec site builds again, and CI now proves it.** `tools/build-spec.mjs` crashed on every run: `marked` v16 replaced the positional `link(href, title, text)` renderer signature with a single token argument, so `href` arrived as an object and `href.split("#")` threw `TypeError`. The renderer now takes `{ href, title, tokens }` and renders the link text through `this.parser.parseInline`; link rewriting is unchanged — `LOCAL_TARGETS` entries resolve to local pages, everything else to GitHub blob URLs. Nothing ran this script on a pull request. `pages.yml` invokes it only on push to `main`, where a total failure showed up as a failed deploy rather than a red check, so `/spec/` had not published for several merges. A `spec-site` job in `ci.yml` now renders the site, and asserts every page and the 0.7 schema landed, on every pull request.
- **§18 names the regulation it positions against.** The section opened by gesturing at "regulatory Digital Product Passport (DPP) initiatives" without a regulation number, which reads to anyone working with the EU DPP as though it had not been looked at. A new §18.0 names **Regulation (EU) 2024/1781** (ESPR) Chapter III, states outright that an ODP passport is not an ESPR DPP and must not be presented as satisfying an ESPR obligation, and then names the only two substantive overlaps: Art. 11(e), a passport remaining available after insolvency, liquidation or cessation of activity — which an on-chain record has by construction, though the bundle behind `dataUrl` does not — and Art. 11(g), authentication, reliability and integrity of the data, which is what `dataHash` / `anchorsHash` and the card check are for. Existing subsection numbers are untouched, so every cross-reference to §18.1 and §18.2 still resolves.

### Removed

- **`schema/passport-0.6.schema.json` and `schema/examples/{physical,digital,mixed}.json`**, together with the CI job that validated one against the other. The 0.6 line is superseded; its release notes stay as written, and a passport issued under it still verifies against its on-chain hashes, which do not depend on the schema file. The 0.7 corpus gains `physical`, `digital` and `mixed` alongside the existing `edition`.
- **`schema/passport-0.5.schema.json`**, for the same reason and on the same terms: 0.5 is superseded exactly as 0.6 is, and leaving one dead line in `schema/` while removing the other only invites the question of which of them is live. Its one dependant was [`docs/OBJECTID_PROFILE.md`](docs/OBJECTID_PROFILE.md), which cited the file as the machine-readable check for its `objectId` block. That block belongs to the v0.5 document shape; the v0.7 line has no `objectId` at all, because the Object ID identification categories became first-class fields and anchors of `passport.json` itself (§9). Both language versions of the profile now open by naming the line they describe and point at `schema/passport-0.7.schema.json` for validation on the current one.

### Changed

- **`ODPPassportProofRegistry` derives its packed version instead of hard-coding it.** The satellite carried a written-out `CONTRACT_VERSION = 6` beside a registry computing 7; it now derives `SPEC_MAJOR * 16 + SPEC_MINOR` the way the main registry does, and `SPEC.md` §8 states that a satellite and the registry it is wired to must report the same byte. 109 Hardhat tests pass unchanged.
- **`tools/build-spec.mjs`** points at `schema/passport-0.7.schema.json`; it referenced the removed 0.6 file and would have failed the spec-site build.
- **The canonicalization vectors are on the 0.7 line.** `schema/vectors/physical.*` carried `"version": "0.6"`, so the project's only known-answer vectors fixed the canonical bytes of a superseded line. Regenerated from the document rather than edited by hand: `dataHash` becomes `0xf605c10cdd02f0a349480726733cd65696ea95e94e8c75069b64cafaf3e30140`, `anchorsHash` is unchanged at `0x24ade00dc43b64a86c7f59d7e996035d59654d302fda07e7011cdada5513925f` because `version` is not part of the `anchors` array.
- **The permanence sentence in the README** now says what it covers: a deployed registry answers for as long as the chain does, which is not a promise that one address serves every generation.
- The **organization profile README** is rewritten against the repository as it is, and its repository-relative links are checked by CI — it described the pre-0.7 layout, listed two of four repositories, and linked a file that does not exist.
- **Branch protection is committed configuration** rather than a description of what to click: two importable rulesets under [`.github/rulesets/`](.github/rulesets/).
- CI checkouts no longer persist the job token into `.git/config`.

### Added

- **`idGranularity` — what a passport identifies.** A required top-level field: `model` (a design, any unit of it), `batch` (one production run), or `item` (one physical object). ODP had folded this into `edition.model`, which answers a different question — how large the run is, not what the record points at — and then needed the distinction anyway in §20, where it was encoded implicitly through the presence of a `unit_key_set` anchor. §9 also states the consequence a verifier must respect: matching an object against a `model` or `batch` passport matches the class, not the individual, and must not be presented as identifying that specific object.
- **Measurement units are a code list.** The `dimensions` anchor now requires `data.unit`, and the value must be a UN/CEFACT Rec 20 common code — `MMT`, `CMT`, `MTR`, `INH`, `FOT`. It was free text, so `"cm"` and `"centimetres"` were equally valid and neither was comparable by software; a measure software cannot compare cannot identify an object. Optional `upperTolerance` / `lowerTolerance` state how far a measured object may fall outside the figures and still match. The code is what the document carries — §9 says a client SHOULD render the unit in the reader's language, because `60 × 40 CMT` is a machine's sentence.
- **[`SPEC.md` §16.1](SPEC.md) — durable hosting for `dataUrl`, a normative SHOULD.** Three properties: content-addressed or otherwise integrity-bound, independent of any single operator including the issuer, and reachable over plain HTTPS without an account or gateway. The section also bounds what a dead `dataUrl` costs: the on-chain card outlives any host, and what goes is the identification evidence in `anchors[]` — a degradation to be shown as such, not a revocation.
- [`docs/ORG_NAMING_AND_SITE.md`](docs/ORG_NAMING_AND_SITE.md) — a proposal, applied nowhere: repository names in the c2pa-org style, what each rename would break, and why `odp.github.io` cannot be obtained.

### Changed — canonical bytes

- **The vector hashes move again, and this supersedes the figures given above in this same section.** `idGranularity` is part of the hashed document and the `dimensions` unit is part of the `anchors` array, so both hashes change this time: `dataHash` is now `0x7ded6c222ad15be7adfa55602c90ae5138d518fd635f566ca6371efb77d3c043` and `anchorsHash` is now `0xa0be7545063f44f42ee6b759d432fc8e9155c81e48dc31e539c6248e47aa267b`. Regenerated from the document, not edited by hand. Both of these changes were made now precisely because they cannot be made later: the canonical bytes freeze at the first mint, and no passport has been issued on any line.

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
