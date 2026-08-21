# Object Digital Passport — release notes · v0.4.1

*Plain-language summary of this version: [**v0.4.1 release note**](releases/v0.4.1.md). This page is the long-form detail behind it.*

*Reference implementation snapshot · protocol line remains **v0.4** (on-chain generation **4**, packed `CONTRACT_VERSION` = **4**). This tag documents the **repository / static UI / tooling** line; it does **not** change the deployed registry ABI by itself.*

## Summary

Patch release **v0.4.1** focuses on **security hardening** of the static web UI, **clearer community workflow** on GitHub, **dependency alignment** for Hardhat 3, **committed TypeScript contract typings**, and small **quality** fixes. No new normative protocol features beyond what is already in `**[SPEC.md](../SPEC.md)*`* for v0.4.

---

## Security & verification (web)

- **Subresource Integrity (SRI)** on third-party scripts loaded from CDNs (`ethers`, QR libraries, `html2canvas`, `jszip`, `jsQR`) on **creator**, **passport**, and **verify** pages — reduces supply-chain risk if a CDN is compromised.
- `**web/odp-passport-v03-ops.js`:** on-chain error text is shown with `**textContent`** (via a small helper), not concatenated into `**innerHTML**`, so exception strings are not interpreted as HTML.
- **Code scanning:** the extra **advanced CodeQL workflow** was **removed** because it conflicted with **GitHub default Code scanning** (SARIF upload rejected). Analysis relies on **default** Code scanning. Findings inside the **generated** WalletConnect bundle (`web/odp-wallet-wc.bundle.js`) were **dismissed** as *won’t fix* (build output from npm dependencies, not hand-maintained source).

---

## Community & GitHub

- New issue template **Standard gap** — propose what is missing or unclear in `**SPEC.md`**.
- `**[CONTRIBUTING.md](CONTRIBUTING.md)`:** **English** for issues, pull requests, and maintainer replies on GitHub; normative spec remains `**[SPEC.md](../SPEC.md)`** (English). Russian `**[web/frontend/localization/](../web/frontend/localization/)**` copies are informational.
- Pull request template: reminder to use **English** for title and description.
- Optional **rulesets** guidance: `**[.github/BRANCH_PROTECTION.md](../.github/BRANCH_PROTECTION.md)`** (local `rulesets/` path is gitignored — templates for import only).

---

## Tooling & dependencies

- Root `**package.json`:** **Hardhat 3.x**, `**@nomicfoundation/hardhat-toolbox-mocha-ethers`**, **dotenv** 17.x, **npm overrides** for known transitive advisories (e.g. `serialize-javascript`, `lodash-es`, `diff`) where applicable.
- `**types/ethers-chain/contracts/`:** generated **TypeScript** typings and factories for the Solidity contracts (for editors and future TS tooling).

---

## Quality & localization

- `**ru/SPEC.md`:** markdown link formatting clean-up (no functional spec change).
- `**web/frontend/verify.html`:** minor brace formatting in `**init()`**.

---

## See also

- **v0.4 narrative (RU):** `[ru/RELEASE_v0.4.md](ru/RELEASE_v0.4.md)`
- **v0.4 pointer (EN):** `[V0.4.md](V0.4.md)`
- **Versioning & tags:** `[VERSIONING_AND_RELEASES.md](VERSIONING_AND_RELEASES.md)`

---

*When you publish git tag `**v0.4.1`**, attach these notes or link this file in the GitHub Release.*