# Object Digital Passport — Release notes · v0.3

This note is written in plain language for operators, creators, and integrators. The normative protocol remains **[`SPEC.md`](SPEC.md)**.

## What v0.3 adds (in plain words)

**v0.3** extends the same single-contract model with **ownership**, an **account-scoped publishing agent** (who may call **`updatePassportUrls`** for the issuer’s passports), **irreversible passport revocation**, **governance** (one on-chain address), **up to three image hashes** on-chain, optional **`auxCommitmentHash` / `auxCommitmentUri`** (second mutable document anchor per passport), **extension mints** (**`mintDigitalViaExtension`**, **`mintPhysicalViaExtension`**) with **`ExtensionMintUsed`**, **P/M institutional** flows (counterfeit concern flag, P-affiliation lifecycle), and optional **DID document** export — see [`SPEC.md`](SPEC.md) and the **Current release** table in [`README.md`](README.md) for the deployed **v0.2** baseline and network addresses.

**Bytecode trade-offs (EIP-170):** the reference **v0.3** contract stays under the **24 KiB** deploy limit by omitting some **v0.2** helpers — notably **`resolvePassport`**, on-chain **paged list readers**, **`attestExternalDocument` / `getExternalDocumentAttestation`**, and long **P-type** `require` strings (replaced by **`EC(71)`**). Verifiers should use **`getPassport` + `getCreator` + `getProofsForPassport`**; UIs paginate **client-side**. Wallet document anchoring remains on **v0.2** deployments only; passport-scoped aux commitments replace part of that use case on **v0.3**.

- **No protocol fee** — you only pay **network gas** (e.g. Polygon POL).
- **Governance** is a **single** `address` in the contract. It may point to a **multisig or Safe** controlled off-chain; there is **no** institutional multisig implemented **inside** the bytecode.
- **Extended operations** (transfer, delegate, revoke, governance transfer, institutional actions) are available in the **Passport** web UI when connected to a **v0.3-shaped** registry (`CONTRACT_VERSION` / generation ≥ v0.3). A **full separate ops CLI** is not shipped; advanced flows can still use **Etherscan**, **Hardhat scripts**, or **`tools/mint.py`** where applicable.

## Contract surface (summary)

- **Owner** (starts as creator; changes via `transferPassport`): `transferPassport`, `updatePassportUrls` (owner, creator, or the issuer’s active publishing agent per spec).
- **Issuer wallet** (registered profile): `delegateCreatorPublishing`, `revokeCreatorPublishing` (account-wide publishing agent for hosted URLs).
- **Creator or governance**: `revokePassport(humanId, reasonHash)` with non-zero `reasonHash` (typically `keccak256(utf8(reason))`).
- **Governance only**: `transferGovernance(newGovernance)`, `setMintExtension(mintClass, extension)` — registers or clears an `IODPExtension` per **`mintClass`** byte (not **C/B/P/M**). **`mintDigitalViaExtension`** / **`mintPhysicalViaExtension`** call the extension’s **`validate`/`normalize`**; **`normalize`** must return `abi.encode` of the **13-tuple** (digital + aux) or **16-tuple** (physical + aux) per [`SPEC.md`](SPEC.md). Examples: **[`contracts/examples/ODPPassThroughDigitalExtension.sol`](contracts/examples/ODPPassThroughDigitalExtension.sol)**, **[`contracts/examples/ODPPassThroughPhysicalExtension.sol`](contracts/examples/ODPPassThroughPhysicalExtension.sol)**. **`ExtensionMintUsed(mintClass, kind, humanId)`** is emitted after a successful extension mint (`kind`: `0` digital, `1` physical), in addition to **`PassportMinted`**.
- **Creator or governance**: **`updatePassportAuxCommitment(humanId, newHash, newUri)`** — updates **`auxCommitmentHash` / `auxCommitmentUri`** when the passport is not revoked; emits **`PassportAuxCommitmentUpdated`**.
- **P / M institutions**: `raiseCounterfeitConcern`, `clearCounterfeitConcern` (prover-only clear).
- **P parent**: `detachPAffiliation` (child Profile ID); propose/confirm/cancel affiliation remain on **Profile** ([`web/creator.html`](web/creator.html)).

## Deploying the site after a new contract

1. Deploy the contract from [`deploy/`](deploy/) as for v0.2.
2. Set the **same** **`NET.contract`** (40 hex chars) in **`web/creator.html`**, **`web/passport.html`**, and **`web/verify.html`**.
3. Do **not** point the reference UI at legacy generation **0** contracts.

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
