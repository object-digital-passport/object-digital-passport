# Protocol work tracks (audit follow-up vs shipped features)

*Non-normative index. Binding rules remain in [`SPEC.md`](../SPEC.md).*

## Track B — Shipped in this repo (reference bytecode)

- **Mint agent (v0.3 extension):** delegated mint after two-step handshake; `Passport.mintAgent`, `mintOnBehalfOfCreatorId`; see **SPEC** (v0.3 summary + ACL tables).
- **Tooling / ABI:** `web/backend/js/odp-contract.js`, `web/frontend/passport.html`, `chain/tools/mint.py`, tests under `chain/deploy/test/`.

## Track A — After-audit backlog (documentation and future bytecode)

- **SECURITY model:** [`SECURITY.md`](SECURITY.md) describes the **v0.4** reference line (`CONTRACT_VERSION` **4**, optional **`ODPCounterfeitConcern`**, UTC prefix rules). Revisit when adding satellites or changing trust boundaries; Russian mirror: [`web/frontend/localization/ru/SECURITY.md`](../web/frontend/localization/ru/SECURITY.md).
- **Verifier copy:** M/P profile trust warning in `verify.html` (on-chain ID ≠ verified institution name).
- **Optional protocol (not in current `ObjectDigitalPassport.sol`):**
  - Global uniqueness of passport `dataHash` (product decision; would be a contract change).
  - Optional **author attestation (ECDSA)** — specified in **SPEC** as *planned*; Solidity only after EIP-170 strategy (see below).

## EIP-170 (24 KiB deploy limit)

The reference **`ObjectDigitalPassport`** artifact may exceed the mainnet bytecode limit. Local **Hardhat** tests may use `allowUnlimitedContractSize`; **Polygon / Ethereum mainnets enforce the limit**.

See **[`docs/EIP170_STRATEGY.md`](EIP170_STRATEGY.md)** for options (optimizer, split satellite contracts, feature staging) before deploying Track B or adding Track A on-chain features.

## ECDSA implementation

Contract work is **explicitly deferred** until:

1. **SPEC** *Author attestation (ECDSA)* section is stable (`ecdsa-capability-spec` in internal planning).
2. **EIP-170** path chosen (`eip170-strategy`).

No on-chain author signature verification exists in the reference contract today.

## Versioning: 0.x lines vs alignment toward v1

- **Normative:** **[`SPEC.md`](../SPEC.md)** — section *IMPORTANT: registry versions, 0.x incompatibility, and alignment toward v1*.
- **Summary:** **v0.3** is **not** backward compatible with **v0.2** or **v0.1** (separate registries: address, bytecode, ABI). The **v0.3** reference is documented so **stable v1** can later specify migration / dual-read; that is **intent** until v1 ships.
