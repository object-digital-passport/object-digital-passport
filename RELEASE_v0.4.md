# Object Digital Passport — Release notes · v0.4 branch

This note summarizes the **v0.4 branch** in this repository vs the prior reference registry shape. Normative detail: **[`SPEC.md`](SPEC.md)**. Deploy: **[`deploy/README.md`](deploy/README.md)**.

## On-chain (EIP-170)

- **Packed `CONTRACT_VERSION` is `4`** at mint and in `submitProof` (same **v0.3-shaped** `Passport` tuple as generation **3** deploys; minor bump via **`SPEC_MINOR`**). The main registry remains deployable on Polygon under the 24 KiB creation limit.
- **Public getters removed** from the reference bytecode to save size: **`SPEC_MAJOR()`**, **`SPEC_MINOR()`**, **`MONTHLY_LIMIT_C()`**, **`MONTHLY_LIMIT_B()`**. Use **`CONTRACT_VERSION`**, **`getRemainingMints`**, and normative limits **C = 1000**, **B = 100_000** from SPEC / source.
- **`ODPPassportLib`**: NFC `nfcModel` remains **`NTAG424DNA_TT`** only (TagTamper).
- **`ODPCounterfeitConcern`** (new **satellite**): **`raiseCounterfeitConcern`**, **`clearCounterfeitConcern`**, **`getCounterfeitConcern`** — **P** and **M** only; only the raising profile may clear. Constructor pins one **`ObjectDigitalPassport`** address. Integrators must use an **`IODPRegistryForCounterfeit`-compatible `getCreator` return** (struct layout) when wiring another registry.

## Web

- **`NET.counterfeitConcern`**: optional satellite address; must be deployed against the same **`NET.contract`** as the main registry. Helpers: **`odpCounterfeitReadContract`** / **`odpCounterfeitWriteContract`** in **`odp-contract.js`**.
- Passport mint UI falls back to **1000** / **100_000** for tier limits when on-chain getters are absent.

## Satellite custom errors

**`ODPCounterfeitConcern`**: **80** = already active; **81** = not active; **82** = clear unauthorized.
