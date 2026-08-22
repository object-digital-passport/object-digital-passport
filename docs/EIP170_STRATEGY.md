# EIP-170 bytecode limit — strategy for `ObjectDigitalPassport`

The Ethereum **Spurious Dragon** rule caps **contract creation bytecode** at **24576 bytes**. Polygon PoS inherits this limit.

## Current situation

- The deployable reference line now uses a **split architecture**:
  - main registry: [`chain/contracts/ObjectDigitalPassport.sol`](../chain/contracts/ObjectDigitalPassport.sol)
  - linked library: [`chain/contracts/ODPPassportLib.sol`](../chain/contracts/ODPPassportLib.sol)
  - satellites: [`chain/contracts/ODPRegistryRelations.sol`](../chain/contracts/ODPRegistryRelations.sol), [`chain/contracts/ODPPassportProofRegistry.sol`](../chain/contracts/ODPPassportProofRegistry.sol), [`chain/contracts/ODPExtensionMintRouter.sol`](../chain/contracts/ODPExtensionMintRouter.sol), plus optional document-anchor / counterfeit satellites
- With optimizer `runs: 1` and `viaIR: true` (see [`hardhat.config.ts`](../chain/hardhat.config.ts)), the **main registry** is intended to stay **≤ 24 KiB**. Run `npm run compile` from the repo root and inspect **`[ODP] EIP-170:`** before public deployment.
- **Hardhat** network is configured with **`allowUnlimitedContractSize: true`** so local tests can run; this **does not** apply to public chains.

## Before any mainnet / Amoy deploy

1. Run `npx hardhat clean && npm run compile` from the repository root and inspect compiler output / artifact size (or use `hardhat-contract-sizer` if added).
2. If over limit, pick one or combine:

### Option A — Shrink monolith

- Further lower optimizer `runs`, review duplicate logic, shorten custom errors usage only if it helps (revert strings are already avoided).
- Remove or gate rare code paths only if product agrees.

### Option B — Satellite contracts

- Preferred reference approach for v0.5+: keep creator/passport core on the main registry, and move optional / orthogonal surfaces into satellites with explicit pairing to the same registry address.

### Option C — New deployment line

- Freeze current bytecode for archive; ship **v0.4+** as a slimmer or split architecture with a **new address** (no automatic migration).

## Policy

- **Do not** assume `allowUnlimitedContractSize` for production.
- Any new on-chain feature (unique `dataHash`, ECDSA verification) must include **size budget** in the review.
