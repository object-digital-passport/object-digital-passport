# ODP Security Model · v0.4 reference line

*Author: Andrei Chernikov*

Object Digital Passport is a **registry of claims**, not a guarantee of physical authenticity.
This document describes the threat model, known limitations, and recommendations for the **v0.3-shaped tuple** reference contract line. **v0.3** mainnet-style deploys used packed byte **3**; the **v0.4 branch** in this repository mints **`CONTRACT_VERSION` 4** with the same struct layout. Normative field names and rules: **[`SPEC.md`](SPEC.md)**.

---

## What the protocol guarantees

- A passport or profile record exists on-chain at a specific timestamp (within the chosen deployment).
- **Integrity anchor:** `dataHash`, image hashes, `fileHash`, and `sealHash` recorded at mint are **immutable** on-chain.
- The profile ID (`creatorId`) is tied to the **registered wallet** for that profile at registration time.
- **No one** — including the deployer — can delete or rewrite immutable hash fields on existing passports.
- **Contract version:** deployments expose `CONTRACT_VERSION` / generation; verifiers should confirm they read the intended registry (address + chain).

## Registry versions: v0.3 vs older 0.x and future v1

- **No backward compatibility** between reference **v0.3**, **v0.2**, and **v0.1**: each is a different deployment (bytecode + ABI). The same wallet may have different `creatorId` values on different lines; passport IDs and records do not auto-migrate.
- **v0.3 forward alignment:** the reference line is specified so a future **stable v1** can define migration or dual-verification paths using stable identifiers and `contractVersion` on records — see **[`SPEC.md`](SPEC.md)** (*IMPORTANT: registry versions…*). Until v1 is published, treat this as **design intent**, not a guarantee of upgrade for any live registry.

## What the protocol does NOT guarantee

- That the physical object exists or that off-chain files at `dataUrl` are still hosted (the chain stores hashes and URL **hints**).
- That the creator or institution is who they claim to be **off-chain** (IDs are registered permissionlessly).
- That an NFC chip is genuinely NTAG 424 DNA TagTamper or that the public key matches the installed chip.
- That **P-** or **M-** type profiles represent a real museum or institution **on-chain** — the protocol stores an ID and type prefix only; names are self-declared.
- That the person holding the wallet is the original artist or rightsholder.
- **Optional future features** described in **SPEC** (e.g. global `dataHash` uniqueness, **author ECDSA attestation**) are **not** security properties until deployed in bytecode for your registry — see **SPEC** *Planned* sections.

### URLs vs hashes (important)

- The **verifier** (or any client) that fetches bytes from `dataUrl` and compares SHA-256 to **`dataHash`** can detect content substitution.
- The chain **does not** fetch HTTPS; “the data at `dataUrl` matches the hash” is true **only after** a correct off-chain check. Treat unknown or malicious `dataUrl` as untrusted until verified.

---

## v0.3-specific trust boundaries

### Governance (single on-chain address)

- **`governance`** is one `address` (constructor defaults to deployer; should be moved to a multisig/Safe via **`transferGovernance`**).
- A compromised **`governance`** can affect **policy-level** actions allowed by the contract (e.g. revoke passports alongside creator, register mint extensions, aux updates where permitted). There is **no** on-chain timelock in the reference bytecode — operate multisig and procedures off-chain.
- **`deployer`** alone can **`freeze()`** (irreversible stop to new writes).

### Mint agent (delegated mint)

- A **principal** profile can authorize a **mint agent** wallet (two-step handshake: **`requestMintAgentRole`** / **`confirmMintAgentRole`**).
- The agent may call mint functions with **`mintOnBehalfOfCreatorId`** set to the principal’s **`creatorId`**.
- On-chain, **`Passport.creator`** and initial **`owner`** are the **principal** wallet; **`Passport.mintAgent`** records who sent the transaction (`address(0)` if the principal minted themselves).
- **C/B** monthly mint caps count against the **principal** wallet, not the agent.
- Principals should revoke delegation (**`revokeMintAgentRole`**) when the relationship ends; agents can **`renounceMintAgentRole`**.

### Publishing agent (URLs only)

- **`delegateCreatorPublishing`** allows a separate wallet to call **`updatePassportUrls`** for passports whose **`creator`** is the delegating issuer — **only** URL fields, hashes unchanged. This is **not** mint delegation.

### Extensions (`IODPExtension`)

- Governance may register external contracts for **`mint*ViaExtension`**. A malicious or buggy extension trusted by governance can affect mint outcomes. Treat extension registration as **high privilege**.

### P- and M-type profiles (social / institutional trust)

- **Same class of risk:** verifiers see a type label (e.g. Institution / Museum) and a profile ID. **On-chain does not verify** the legal name or website of the organization.
- Confirm **`creatorId`** on the organization’s **official** channel before trusting proofs or institutional claims.

### Auxiliary commitment

- **`auxCommitmentHash` / `auxCommitmentUri`** may be updated by **creator or governance** per **SPEC**; they are **not** the same immutability class as `dataHash`.

---

## Known risks and mitigations (carried forward)

### 1. Social engineering and phishing

**Risk:** Fake verifier site; fake “official” P/M institution; malicious `dataUrl` / `noteUrl`.

**Mitigation:**

- Compare fetched content to on-chain hashes locally.
- Treat profile IDs as opaque strings; verify them on **official** sites.
- Do not trust `noteUrl` without domain checks.

### 2. Stolen creator or owner wallet

**Risk:** **`updatePassportUrls`** (with `confirmedDataHash`) does not stop an attacker who can read `dataHash` from chain (stolen key).

**Mitigation:** Hardware wallet; limit exposure; **`revokePassport`** if needed (creator or governance).

### 3. Stolen mint agent wallet

**Risk:** While delegation is active, an agent can mint on behalf of the principal (within caps and rules).

**Mitigation:** Principal **`revokeMintAgentRole`** immediately; short-lived delegation; separate agent hot wallet with minimal privileges elsewhere.

### 4. Multiple wallets (anti-spam, not anti-Sybil)

**Risk:** **C** / **B** tiers have per-calendar-month caps; **P** / **M** are unlimited in the reference contract. New wallets bypass per-wallet caps.

**Accepted tradeoff:** permissionless design; off-chain reputation if needed.

### 5–8. Frontend CDN, RPC privacy, canonical JSON, NFC, numbered seals

Unchanged from v0.1 guidance — see **SPEC** §9–11 for JSON/NFC levels.

---

## Deployer key security

Same as v0.1: **`freeze()`** only; cannot alter historical records. Protect offline.

---

## Verifier checklist (for users)

When verifying an object:

- [ ] **Chain and contract:** you are connected to the intended network and registry address (or known-good deployment).
- [ ] Passport ID matches QR / bundle (`humanId` / `passportId`).
- [ ] Passport data status shows **AUTHENTIC** (hash check succeeded).
- [ ] **`creatorId`** matches what the issuer publishes on an **official** site.
- [ ] For **P** or **M** profiles — the ID is **not** proof of identity on-chain; confirm on the institution’s official channel.
- [ ] If **`mintAgent`** is shown non-zero — understand a delegate executed the mint; **`creator`** is still the issuer wallet on record.
- [ ] Proof records — find each **`creatorId`** on the institution’s site if you rely on proofs.
- [ ] NFC — challenge-response where applicable; numbered seal — visual compare.
- [ ] `dataUrl` / image URLs — legitimate domains; verify file hashes where offered.

---

## Planned protocol options (not deployed in reference bytecode yet)

Described in **[`SPEC.md`](SPEC.md)** for roadmap alignment only:

- **Global uniqueness of passport `dataHash`** — would forbid two mints with the same JSON anchor hash; product tradeoff.
- **Optional author attestation (ECDSA)** — separate key could attest to `dataHash` / profile binding; **no** on-chain verification in the current reference contract; implementation blocked on **bytecode size / architecture** — see **[`docs/EIP170_STRATEGY.md`](docs/EIP170_STRATEGY.md)**.

---

## Third-party static analysis (e.g. Remix)

**Informal snapshot only — not a substitute for a professional audit.**

A pass through **Remix** (or similar IDE/static tooling) on the reference **`ObjectDigitalPassport.sol`** reported **no major on-chain issues** immediately suggesting direct theft or classic scam patterns, and noted sensible patterns: **custom errors**, **input validation**, **role checks** (`governance`, creator, owner paths), **`notFrozen`** on writes, and limited reentrancy surface on core paths.

**Limits of this class of tools:** they do **not** model **off-chain** trust (`dataUrl` / hosted files), **governance** policy (malicious extensions, revocation power), **economic** abuse (e.g. a **mint agent** burning a principal’s **C/B** monthly quota), or deployment/configuration mistakes. **`mint*ViaExtension`** uses **`staticcall`** into **governance-approved** extension contracts — not classic reentrancy into this registry, but a **trust boundary** on the extension’s correctness.

Treat **formal verification**, **timelocks** for governance (off-chain multisig process if bytecode stays minimal), and **event** consistency as **production hardening**, not conclusions from a single static run.

---

## Reporting security issues

Open an issue at:
[https://github.com/object-digital-passport/object-digital-passport/issues](https://github.com/object-digital-passport/object-digital-passport/issues)

For sensitive disclosures, contact via GitHub private security advisory.
