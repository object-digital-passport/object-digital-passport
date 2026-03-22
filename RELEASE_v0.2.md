# Object Digital Passport — v0.2 release notes

## Contract

- **`CONTRACT_VERSION`** is **2** on new deployments.
- **No protocol fee** — `registerCreator`, `mintPhysical`, and `mintDigital` are **nonpayable**; users pay **Polygon gas (POL)** only.
- **`dataUrl` optional** at mint — empty string is allowed. If empty, the public Verify page **cannot** fetch `passport.json` from the network; **only** someone who holds the canonical **`passport.json`** file can check details and authenticity (compare canonical hash to on-chain `dataHash`).
- **`updatePassportUrls`** — `newDataUrl` may be empty (clear public URL) or non-empty (add/change), subject to length limits.

## Deployment

1. From `deploy/`: `npm install` (once), then `npx hardhat compile` and `npx hardhat run scripts/deploy.js --network amoy` (testnet) or `--network polygon` (mainnet).
2. Copy the deployed address into **`NET.contract`** in `web/creator.html`, `web/passport.html`, and `web/verify.html` (all three must match).
3. The static site expects **v0.2** bytecode (folder-base mint flags, nonpayable mints, optional `dataUrl`). The legacy **v0.1** mainnet contract `0x380092fA9C708BF01a552247909CF5DeceFb469E` is **not** compatible with this UI/ABI.

## Tools

- `tools/mint.py` — ABI updated for nonpayable register/mint; optional hosted URL prompt.
