# Object Digital Passport — Release notes · v0.2

Hi — thanks for reading. This note is meant for **humans**, not only for developers.

## What v0.2 is (in plain words)

**v0.2** is the line we treat today as the **most stable proof of concept**: one Solidity contract, static pages, and docs that line up with how we actually want the protocol to behave **now** — gas-only use (no separate burned “protocol fee” on register/mint), optional public JSON URL at mint, and a clearer story for verification.

Earlier work lived under the **v0.1** idea (first Polygon deploy, fee-era rules). In practice, **not every improvement we made while iterating on “0.1” ended up neatly frozen in a single perfect v0.1 tag** — as the person running the repo, I’m still **getting comfortable with GitHub** (releases, tags, what landed when). So please don’t read “v0.1” as a perfectly complete snapshot of every experiment; **v0.2 is the coherent baseline we’re pointing people to** for a serious PoC today.

If you’re new here: **start with v0.2** in this repo and in [`README.md`](README.md). The old mainnet contract at `0x3800…` remains **legacy** (generation `0` on-chain); the UI still supports it with a **warning**, but new deployments should follow **v0.2** rules.

---

## What changed in the contract (technical)

- **`CONTRACT_VERSION`** is **2** on new deployments.
- **No protocol fee** — register and mint are **nonpayable**; you only pay **Polygon gas (POL)**.
- **`dataUrl` is optional** at mint. If you leave it empty, the public Verify page can’t fetch your JSON from the web; only someone with the real **`passport.json`** file can check it against the on-chain hash.
- **`updatePassportUrls`** — you can set, change, or clear the public URL (within length limits), still matching the same `dataHash`.
- **Monthly mint caps (anti-spam, gas-only)** — per wallet, per calendar month: **`C`** ≈ **1,000** mints, **`B`** ≈ **100,000** mints, **`P`** unlimited (`getRemainingMints` returns `2³²−1` for `P`). Large inventories should use **`B`** (organization) or several wallets — not the individual **`C`** tier. See **`SPEC.md`** (Creator ID → monthly caps).

---

## Deploying v0.2 yourself

1. From the `deploy/` folder: install deps once, compile, then run the deploy script on Amoy (test) or Polygon (main)
, as in [`deploy/scripts/deploy.js`](deploy/scripts/deploy.js).
2. Paste the **new contract address** into **`NET.contract`** in **`web/creator.html`**, **`web/passport.html`**, and **`web/verify.html`** (same address in all three).
3. The **legacy** v0.1 contract (`0x3800…`) uses different bytecode — don’t mix it with the v0.2 UI without the compatibility layer (see `web/odp-contract.js`).

---

## Tools & site

- **`tools/mint.py`** — updated for nonpayable calls and optional hosted URL.
- **Site version** — see **`ODP_SITE_VERSION`** in [`web/odp-contract.js`](web/odp-contract.js) (small doc/UI tweaks bump the patch number; contract-facing UI behavior is tied to **on-chain generation**, not only that string).
- **Stack panel** — every page shows **site SemVer trust** (red/yellow/green) and the **read policy**: primary **then** **`previousContracts`** on Verify if a record is missing on the current deployment.
- **Legacy deployments** (generation **0**) show an **amber banner** on Creator / Passport / Verify so nobody mistakes old rules for the latest PoC.

---

*Questions or corrections welcome via issues — we’re learning in public.*
