# Object Digital Passport — v0.1

**Author:** Andrei Chernikov

First tagged release of the reference implementation: specification, Solidity contract, static web UI, and helper tooling.

## Live demo (GitHub Pages)

- **Site:** https://object-digital-passport.github.io/odp-v.0.1/
- **Verify** (read-only, no wallet): https://object-digital-passport.github.io/odp-v.0.1/verify.html  
- **Creator ID:** https://object-digital-passport.github.io/odp-v.0.1/creator.html  
- **Passport:** https://object-digital-passport.github.io/odp-v.0.1/passport.html  

## Deployment

| | |
|:--|:--|
| **Network** | Polygon PoS (chain ID **137**) |
| **Contract** | [`0x380092fA9C708BF01a552247909CF5DeceFb469E`](https://polygonscan.com/address/0x380092fA9C708BF01a552247909CF5DeceFb469E) |

## Documentation

- **Protocol (normative):** [`SPEC.md`](https://github.com/object-digital-passport/odp-v.0.1/blob/main/SPEC.md) · [`SPEC_RU.md`](https://github.com/object-digital-passport/odp-v.0.1/blob/main/SPEC_RU.md)  
- **Security / threat model:** [`SECURITY.md`](https://github.com/object-digital-passport/odp-v.0.1/blob/main/SECURITY.md)  
- **Overview:** [`README.md`](https://github.com/object-digital-passport/odp-v.0.1/blob/main/README.md)  

## In this repository

- `contracts/` — `ObjectDigitalPassport.sol`  
- `web/` — static UI (`creator.html`, `passport.html`, `verify.html`)  
- `deploy/` — Hardhat deploy scripts  
- `tools/` — CLI helpers (e.g. minting)  
