# EIP-170 bytecode limit — strategy for `ObjectDigitalPassport`

The Ethereum **Spurious Dragon** rule caps **contract creation bytecode** at **24576 bytes**. Polygon PoS inherits this limit.

## Current situation

- The reference registry [`contracts/ObjectDigitalPassport.sol`](../contracts/ObjectDigitalPassport.sol) is compiled with the optimizer (`runs: 1`, `viaIR: true` in [`hardhat.config.ts`](../hardhat.config.ts)) and **links** [`contracts/ODPPassportLib.sol`](../contracts/ODPPassportLib.sol) so deployed **registry** bytecode stays **≤ 24 KiB** (library is a **separate** on-chain contract; both must be under the limit at creation — run `npm run compile` from the repo root and read **`[ODP] EIP-170:`**).
- **Hardhat** network is configured with **`allowUnlimitedContractSize: true`** so local tests can run; this **does not** apply to public chains.

## Before any mainnet / Amoy deploy

1. Run `npx hardhat clean && npm run compile` from the repository root and inspect compiler output / artifact size (or use `hardhat-contract-sizer` if added).
2. If over limit, pick one or combine:

### Option A — Shrink monolith

- Further lower optimizer `runs`, review duplicate logic, shorten custom errors usage only if it helps (revert strings are already avoided).
- Remove or gate rare code paths only if product agrees.

### Option B — Satellite contracts

- Move **mint-agent delegation** and/or **future** features (unique `dataHash` registry, ECDSA helper) to a **small secondary contract** the main registry `call`s or that users approve — **design in SPEC first** to keep trust boundaries clear.

### Option C — New deployment line

- Freeze current bytecode for archive; ship **v0.4+** as a slimmer or split architecture with a **new address** (no automatic migration).

## Policy

- **Do not** assume `allowUnlimitedContractSize` for production.
- Any new on-chain feature (unique `dataHash`, ECDSA verification) must include **size budget** in the review.
