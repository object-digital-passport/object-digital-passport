# EIP-170 bytecode limit — strategy for `ObjectDigitalPassport`

The Ethereum **Spurious Dragon** rule caps **contract creation bytecode** at **24576 bytes**. Polygon PoS inherits this limit.

## Current situation

- The reference [`contracts/ObjectDigitalPassport.sol`](../contracts/ObjectDigitalPassport.sol) is compiled with the optimizer (`runs: 1`, `viaIR: true` in [`deploy/hardhat.config.js`](../deploy/hardhat.config.js)) but may still **exceed** the limit.
- **Hardhat** network is configured with **`allowUnlimitedContractSize: true`** so local tests can run; this **does not** apply to public chains.

## Before any mainnet / Amoy deploy

1. Run `cd deploy && npx hardhat clean && npx hardhat compile` and inspect compiler output / artifact size (or use `hardhat-contract-sizer` if added).
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
