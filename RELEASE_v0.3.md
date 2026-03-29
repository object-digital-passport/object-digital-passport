# Object Digital Passport — Release notes · v0.3

This note is written in plain language for operators, creators, and integrators. The normative protocol remains **[`SPEC.md`](SPEC.md)**.

## What v0.3 adds (in plain words)

**v0.3** extends the registry with **ownership**, an **account-scoped publishing agent** (who may call **`updatePassportUrls`** for the issuer’s passports), **irreversible passport revocation**, **governance** (one on-chain address), **up to three image hashes** on-chain, optional **`auxCommitmentHash` / `auxCommitmentUri`** (second mutable document anchor per passport), **extension mints** (**`mintDigitalViaExtension`**, **`mintPhysicalViaExtension`**) with **`ExtensionMintUsed`**, **P-affiliation lifecycle** (detach on passport UI; propose/confirm on profile), and optional **DID document** export — see [`SPEC.md`](SPEC.md) and the **Current release** table in [`README.md`](README.md) for the **v0.3** reference deployment addresses on Polygon.

**Bytecode (EIP-170):** the reference **v0.3** **`ObjectDigitalPassport`** **omits** some **v0.2** surface — notably **`resolvePassport`**, **`getProofsForPassportPaged`**, **`attestExternalDocument` / `getExternalDocumentAttestation`**, the on-chain **counterfeit concern** registry, and long **P-type** `require` strings (replaced by **`EC(71)`**). Verifiers use **`getPassport` + `getCreator` + `getProofsForPassport`**. For large lists, the registry exposes **`getPassportsByCreatorPaged`** and **`getPAffiliatedChildrenPaged`**. Heavy **pure** logic (mint validation, extension decode, URL resolution, ID string formatting) lives in a separately deployed linked library **`ODPPassportLib`** ([`contracts/ODPPassportLib.sol`](contracts/ODPPassportLib.sol)) so the **registry** bytecode stays **under the 24 KiB creation limit** (check **`[ODP] EIP-170:`** after `hardhat compile`). **Deploy order:** **`ODPPassportLib`** first, then **`ObjectDigitalPassport`** with linker metadata (see **`deploy/scripts/deploy.js`** and **`deploy/README.md`**). **Wallet-level file SHA-256 anchoring** for v0.3+ remains **[`contracts/ODPWalletDocumentAnchor.sol`](contracts/ODPWalletDocumentAnchor.sol)** (after the registry; constructor takes the registry address). The reference **Verify** page uses **`NET.docAnchor`** when generation **≥ 3**; passport-scoped **`auxCommitment*`** stays on the registry.

- **No protocol fee** — you only pay **network gas** (e.g. Polygon POL).
- **Governance** is a **single** `address` in the contract. It may point to a **multisig or Safe** controlled off-chain; there is **no** institutional multisig implemented **inside** the bytecode.
- **Extended operations** (transfer, delegate, revoke, governance transfer, institutional actions) are available in the **Passport** web UI when connected to a **v0.3-shaped** registry (`CONTRACT_VERSION` / generation ≥ v0.3). A **full separate ops CLI** is not shipped; advanced flows can still use **Etherscan**, **Hardhat scripts**, or **`tools/mint.py`** where applicable.

## Contract surface (summary)

- **Owner** (starts as creator; changes via `transferPassport`): `transferPassport`, `updatePassportUrls` (owner, creator, or the issuer’s active publishing agent per spec).
- **Issuer wallet** (registered profile): `delegateCreatorPublishing`, `revokeCreatorPublishing` (account-wide publishing agent for hosted URLs).
- **Creator or governance**: `revokePassport(humanId, reasonHash)` with non-zero `reasonHash` (typically `keccak256(utf8(reason))`).
- **Governance only**: `transferGovernance(newGovernance)`, `setMintExtension(mintClass, extension)` — registers or clears an `IODPExtension` per **`mintClass`** byte (not **C/B/P/M**). **`mintDigitalViaExtension`** / **`mintPhysicalViaExtension`** call the extension’s **`validate`/`normalize`**; **`normalize`** must return `abi.encode` of the **13-tuple** (digital + aux) or **16-tuple** (physical + aux) per [`SPEC.md`](SPEC.md). Examples: **[`contracts/examples/ODPPassThroughDigitalExtension.sol`](contracts/examples/ODPPassThroughDigitalExtension.sol)**, **[`contracts/examples/ODPPassThroughPhysicalExtension.sol`](contracts/examples/ODPPassThroughPhysicalExtension.sol)**. **`ExtensionMintUsed(mintClass, kind, humanId)`** is emitted after a successful extension mint (`kind`: `0` digital, `1` physical), in addition to **`PassportMinted`**.
- **Creator or governance**: **`updatePassportAuxCommitment(humanId, newHash, newUri)`** — updates **`auxCommitmentHash` / `auxCommitmentUri`** when the passport is not revoked; emits **`PassportAuxCommitmentUpdated`**.
- **P parent**: `detachPAffiliation` (child Profile ID); propose/confirm/cancel affiliation remain on **Profile** ([`web/creator.html`](web/creator.html)).

## Deploying the site after a new contract

1. Deploy from [`deploy/`](deploy/) — the script deploys **`ObjectDigitalPassport`** and then **`ODPWalletDocumentAnchor`** (see **`walletDocumentAnchorAddress`** in `deployments/<network>.json` if present).
2. Set **`NET.contract`** (40 hex chars) in **`web/creator.html`**, **`web/passport.html`**, and **`web/verify.html`**.
3. For v0.3-shaped registries, set **`NET.docAnchor`** in **`web/verify.html`** to the anchor address so **Anchor a file (wallet)** and hash verification can use the satellite.
4. Do **not** point the reference UI at legacy generation **0** contracts.

## Post-deploy operator checklist (v0.3)

1. **`transferGovernance`** — immediately point **`governance`** at the intended **multisig / Safe** (deployer starts as governance). Confirm on Polygonscan: **`governance()`** returns the new address.
2. **`setMintExtension`** (optional) — for each production **`mintClass`** byte you intend to use, register the audited **`IODPExtension`** address, or **`address(0)`** to clear. Forbidden bytes: same as profile prefixes **C, B, P, M** (ASCII).
3. **Freeze** — only when you intentionally seal the registry; irreversible.

## Post-deploy smoke (manual)

Automated CI runs a **static smoke** (pages load) under [`e2e/`](e2e/). After a real deployment, manually verify:

1. **Connect wallet** → **Profile** registers if needed.
2. **Passport** → mint with **three** optional images (if your build exposes extra image fields) → download **`.odpass`** bundle.
3. **Verify** → paste Passport ID or drop `.odpass` → hashes and status match expectations.
4. **Passport** → **Passport operations (v0.3)** → load a Passport ID → run **one** write operation you care about (e.g. **publishing agent** or **transfer**) and confirm on the block explorer.

## Tools

- **`tools/mint.py`** — minting aligned with the web flow where supported; not a replacement for every v0.3 owner/governance call.
- **`tools/contract_compact_reverts.py`** — optional developer helper to shrink bytecode (see [`tools/README.md`](tools/README.md)); **not** part of the normal release pipeline.

## See also

- **[`SPEC.md`](SPEC.md)** — protocol definition.
- **[`docs/V0.3.md`](docs/V0.3.md)** — short pointer and changelog-style notes (replaces the old exploratory draft).
