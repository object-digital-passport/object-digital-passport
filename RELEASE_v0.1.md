# Object Digital Passport — v0.1

**Author:** Andrei Chernikov

First tagged release of the reference implementation: specification, Solidity contract, static web UI, and helper tooling.

## Live demo (GitHub Pages) — example UI

Static pages preconfigured for the official v0.1 contract below (illustration only; protocol rules are in `SPEC.md`).

- **Site:** https://object-digital-passport.github.io/object-digital-passport/
- **Verify** (read-only, no wallet): https://object-digital-passport.github.io/object-digital-passport/verify.html  
- **Profile:** https://object-digital-passport.github.io/object-digital-passport/creator.html  
- **Passport:** https://object-digital-passport.github.io/object-digital-passport/passport.html  

## Deployment

| | |
|:--|:--|
| **Network** | Polygon PoS (chain ID **137**) |
| **Contract** | [`0x380092fA9C708BF01a552247909CF5DeceFb469E`](https://polygonscan.com/address/0x380092fA9C708BF01a552247909CF5DeceFb469E) |

## Documentation

- **Protocol (normative):** [`SPEC.md`](https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md)  
- **Security / threat model:** [`SECURITY.md`](https://github.com/object-digital-passport/object-digital-passport/blob/main/SECURITY.md)  
- **Overview:** [`README.md`](https://github.com/object-digital-passport/object-digital-passport/blob/main/README.md)  

## In this repository

- `contracts/` — `ObjectDigitalPassport.sol`  
- `web/` — static UI (`creator.html`, `passport.html`, `verify.html`)  
- `deploy/` — Hardhat deploy scripts  
- `tools/` — CLI helpers (e.g. minting)  
