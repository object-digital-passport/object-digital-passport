# Object Digital Passport — Release notes · v0.3

These notes describe **only how the reference v0.3 line differs from v0.2** (protocol surface, bytecode layout, and deployment shape). They are not a full operator manual. The normative protocol remains **[`SPEC.md`](SPEC.md)**. For **deploying your own registry**, **`NET.*`** wiring, smoke checks, and tools, see **[`deploy/README.md`](deploy/README.md)**, **[`README.md`](README.md)**, and **[`tools/README.md`](tools/README.md)**.

## What changed from v0.2 (summary)

**On-chain product (vs v0.2-shaped registry):** v0.3 adds **passport ownership**, an **account-scoped publishing agent** (who may call **`updatePassportUrls`** for the issuer’s passports), **irreversible passport revocation**, **governance** (one on-chain address), **up to three image hashes** on-chain, optional **`auxCommitmentHash` / `auxCommitmentUri`** (second mutable document anchor per passport), **extension mints** (**`mintDigitalViaExtension`**, **`mintPhysicalViaExtension`**) with **`ExtensionMintUsed`**, **P-affiliation lifecycle** (detach on passport UI; propose/confirm on profile), and optional **DID document** export — normative detail in [`SPEC.md`](SPEC.md).

**Bytecode (EIP-170) — removed or relocated vs v0.2 *main* registry:** the reference **v0.3** **`ObjectDigitalPassport`** **omits** some **v0.2** entry points — notably **`resolvePassport`**, **`getProofsForPassportPaged`**, **`attestExternalDocument` / `getExternalDocumentAttestation`** on the main contract, the on-chain **counterfeit concern** registry, and long **P-type** `require` strings (replaced by **`EC(71)`**). Verifiers use **`getPassport` + `getCreator` + `getProofsForPassport`**; for large lists, **`getPassportsByCreatorPaged`** and **`getPAffiliatedChildrenPaged`**. Heavy **pure** logic lives in a linked library **`ODPPassportLib`** ([`contracts/ODPPassportLib.sol`](contracts/ODPPassportLib.sol)) so the **registry** stays **under the 24 KiB creation limit**. **Wallet-level file SHA-256 anchoring** for v0.3+ is in a separate contract **`ODPWalletDocumentAnchor`** ([`contracts/ODPWalletDocumentAnchor.sol`](contracts/ODPWalletDocumentAnchor.sol)) deployed **after** the registry; the reference **Verify** page uses **`NET.docAnchor`** when generation **≥ 3**; passport-scoped **`auxCommitment*`** stays on the main registry.

**Counterfeit concern:** **`raiseCounterfeitConcern`** / related exist on typical **v0.2** main registries but were **removed** from the reference **v0.3** main registry bytecode (EIP-170). A **future** spec/contract line **may** restore or replace that mechanism — see **`SPEC.md`**.

**Unchanged from v0.2 (reminder):** **no protocol fee** — only **network gas**. **Governance** is still a **single** `address` (may point to a multisig/Safe off-chain; no institutional multisig **inside** the bytecode).

**Reference Polygon deployment:** **`deployments/polygon.json`** includes **`walletDocumentAnchorAddress`** alongside the main registry — see the **Current release** table in [`README.md`](README.md). If you already deployed **`ObjectDigitalPassport`** without the anchor, use **[`deploy/scripts/deploy-doc-anchor-only.js`](deploy/scripts/deploy-doc-anchor-only.js)** (see **`deploy/README.md`**) and set **`NET.docAnchor`** in **`web/verify.html`**.

## New or changed contract surface (vs v0.2 registry)

- **Owner** (starts as creator; changes via `transferPassport`): `transferPassport`, `updatePassportUrls` (owner, creator, or the issuer’s active publishing agent per spec).
- **Issuer wallet:** `delegateCreatorPublishing`, `revokeCreatorPublishing`.
- **Creator or governance:** `revokePassport(humanId, reasonHash)` with non-zero `reasonHash`.
- **Governance only:** `transferGovernance`, `setMintExtension` — **`mintDigitalViaExtension`** / **`mintPhysicalViaExtension`** and **`ExtensionMintUsed`** (see [`SPEC.md`](SPEC.md)); examples: **[`contracts/examples/ODPPassThroughDigitalExtension.sol`](contracts/examples/ODPPassThroughDigitalExtension.sol)**, **[`contracts/examples/ODPPassThroughPhysicalExtension.sol`](contracts/examples/ODPPassThroughPhysicalExtension.sol)**.
- **Creator or governance:** **`updatePassportAuxCommitment`** — **`PassportAuxCommitmentUpdated`**.
- **P parent:** `detachPAffiliation`; propose/confirm/cancel affiliation remain on **Profile** ([`web/creator.html`](web/creator.html)).

## See also

- **[`SPEC.md`](SPEC.md)** — full protocol (all versions).
- **[`docs/V0.3.md`](docs/V0.3.md)** — short pointer and changelog-style notes.
