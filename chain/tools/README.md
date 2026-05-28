# Developer tools

## `mint.py`

Primary CLI for minting and related flows. See the root [`README.md`](../README.md) for usage.

## `contract_compact_reverts.py`

Optional **one-off** helper used during Solidity development to replace `require(condition, "msg")` with `if (!(condition)) revert EC(n);` patterns to **reduce bytecode size**.

- **Not** part of the normal deploy or CI pipeline for the reference site.
- Run only when you intentionally refactor revert style in [`chain/contracts/`](../contracts); review diffs carefully and re-run tests (`chain/deploy/` Hardhat suite).

## End-to-end smoke

Lightweight Playwright checks live under [`e2e/`](../e2e/) (static `serve` of the repo root + a few page loads). They do **not** drive a wallet or full mint flows.
