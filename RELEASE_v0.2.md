# Object Digital Passport — Release notes · v0.2

This note is written in plain language for operators, creators, and integrators.

## What v0.2 is (in plain words)

**v0.2** is currently the main proof-of-concept line: one Solidity contract, static pages, and docs that are aligned with real usage.

In short:
- Register/mint/proof are **gas-only** (no separate burned protocol fee in v0.2).
- `dataUrl` is optional at mint.
- Verification flow is clearer and supports both web-hosted and file-based checks.
- JSON now uses **`passportId`** as the Passport ID field (ABI wire name remains `humanId`).

Earlier work lived under the **v0.1** line (first Polygon deployment, fee-era rules).  
Use **v0.2** as the coherent baseline for new PoC work.

If you are new here: start from [`README.md`](README.md) and this v0.2 note.  
The old mainnet contract at `0x3800…` is **legacy** (on-chain byte `0`); the current reference UI does not support it.

---

## What changed in the contract (technical)

- **`CONTRACT_VERSION`** is a packed byte (**2** for spec line **0.2** on current reference bytecode: `SPEC_MAJOR=0`, `SPEC_MINOR=2`); **`SPEC_MAJOR`** / **`SPEC_MINOR`** mirror that line on-chain.
- **No protocol fee** — register and mint are **nonpayable**; you only pay **Polygon gas (POL)**.
- **`dataUrl` is optional** at mint. If you leave it empty, the public Verify page can’t fetch your JSON from the web; only someone with the real **`passport.json`** file can check it against the on-chain hash.
- **`updatePassportUrls`** — you can set, change, or clear the public URL (within length limits), still matching the same `dataHash`.
- **Monthly mint caps (anti-spam, gas-only)** — per wallet, per calendar month: **`C`** ≈ **1,000** mints, **`B`** ≈ **100,000** mints, **`P`** unlimited (`getRemainingMints` returns `2³²−1` for `P`). Large inventories should use **`B`** (organization) or several wallets — not the individual **`C`** tier. See **`SPEC.md`** (profile ID / issuer type → monthly caps).
- **Passport JSON ID key update** — in current docs/exports the JSON field is **`passportId`**; smart-contract ABI/wire naming remains `humanId` for compatibility.

---

## Deploying v0.2 yourself

1. From the `deploy/` folder: install dependencies, compile, then run the deploy script on Amoy (testnet) or Polygon (mainnet), as in [`deploy/scripts/deploy.js`](deploy/scripts/deploy.js).
2. Paste the **new contract address** into **`NET.contract`** in **`web/creator.html`**, **`web/passport.html`**, and **`web/verify.html`** (same address in all three).
3. Don’t point **`NET.contract`** at the legacy v0.1 contract (`0x3800…`) — the reference UI **rejects** on-chain byte `0`.

---

## Tools & site

- **`tools/mint.py`** — updated for nonpayable calls and optional hosted URL; after mint writes **`passports/<Passport ID>.odp`** (same ZIP layout as **SPEC §15** / web Passport export).
- **Site version** — see **`ODP_SITE_VERSION`** in [`web/odp-contract.js`](web/odp-contract.js) (small doc/UI tweaks bump the patch number; contract-facing UI behavior is tied to **on-chain generation**, not only that string).
- **Stack panel** — every page shows **site SemVer trust** (red/yellow/green) and the **read policy**: primary **then** **`previousContracts`** on Verify if a record is missing on the current deployment.
- **Legacy deployments** (byte **0**) are **not supported** by Creator / Passport / Verify — you get a clear error if `NET.contract` points at one.
- **Passport page UX** — for `C`/`B` profiles, mint UI is shown directly; the extra workspace navigator remains only where it is relevant to `P`/`M` flows.

---

Questions and corrections are welcome via issues.
