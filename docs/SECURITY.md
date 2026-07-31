# ODP Security Model · v0.4 reference line

*Author: Andrei Chernikov*

Object Digital Passport is a **registry of claims**, not a guarantee of physical authenticity.

This document describes the threat model, known limitations, and recommendations for the **reference line on `main`**: **`ObjectDigitalPassport`** with packed **`CONTRACT_VERSION` = 4** (same **v0.3-shaped** `Passport` tuple as earlier generation **3** deploys), optional **`ODPCounterfeitConcern`** satellite, and the static web pages wired via **`NET.*`**. Older **v0.3**-era deployments used packed byte **3** at the same tuple layout; they are **different registries** (address + ABI). Normative field names and rules: **[`SPEC.md`](../SPEC.md)**.

---

## What the protocol guarantees

- A passport or profile record exists on-chain at a specific timestamp (within the chosen deployment).
- **Integrity anchor:** `dataHash`, image hashes, `fileHash`, and `sealHash` recorded at mint are **immutable** on-chain.
- The profile ID (`creatorId`) is tied to the **registered wallet** for that profile at registration time.
- **No one** — including the deployer — can delete or rewrite immutable hash fields on existing passports.
- **Contract version:** deployments expose `CONTRACT_VERSION` / generation; verifiers should confirm they read the intended registry (address + chain).
- **UTC-aligned prefixes (v0.4 reference bytecode):** `mintDigital` / `mintPhysical` and `submitProof` **year** / **month** must match **Gregorian UTC** from `block.timestamp` (see **[`docs/V0.4.md`](V0.4.md)** and **[`web/frontend/localization/ru/RELEASE_v0.4.md`](../web/frontend/localization/ru/RELEASE_v0.4.md)**). This **reduces abuse** of human-readable `ODP-YYYY-MM-…` / `PRF-YYYY-MM-…` prefixes; it is **not** a claim about physical objects.

## Registry versions: v0.4 vs older 0.x and future v1

- **No backward compatibility** between reference **v0.4**, **v0.3**, **v0.2**, and **v0.1**: each is a different deployment (bytecode + ABI). The same wallet may have different `creatorId` values on different lines; passport IDs and records do not auto-migrate.
- **Forward alignment:** the specification is written so a future **stable v1** can define migration or dual-verification paths using stable identifiers and `contractVersion` on records — see **[`SPEC.md`](../SPEC.md)** (*IMPORTANT: registry versions…*). Until v1 is published, treat this as **design intent**, not a guarantee of upgrade for any live registry.

## What the protocol does NOT guarantee

- That the physical object exists or that off-chain files at `dataUrl` are still hosted (the chain stores hashes and URL **hints**).
- That the creator or institution is who they claim to be **off-chain** (IDs are registered permissionlessly).
- That an NFC chip is genuinely NTAG 424 DNA TagTamper or that the public key matches the installed chip.
- That **P-** or **M-** type profiles represent a real museum or institution **on-chain** — the protocol stores an ID and type prefix only; names are self-declared.
- That the person holding the wallet is the original artist or rightsholder.
- **Institutional “counterfeit concern” (satellite):** if **`ODPCounterfeitConcern`** is deployed and wired, **P**/**M** profiles can record an **opaque** `reasonHash` and timestamps for a passport ID. That is an **on-chain signal** from that profile at that time — **not** a cryptographic proof that an object is fake, and **not** a substitute for physical inspection or legal process.
- **Optional future features** described in **SPEC** (e.g. global `dataHash` uniqueness, **author ECDSA attestation**) are **not** security properties until deployed in bytecode for your registry — see **SPEC** *Planned* sections.

### URLs vs hashes (important)

- The **verifier** (or any client) that fetches bytes from `dataUrl` and compares SHA-256 to **`dataHash`** can detect content substitution.
- The chain **does not** fetch HTTPS; “the data at `dataUrl` matches the hash” is true **only after** a correct off-chain check. Treat unknown or malicious `dataUrl` as untrusted until verified.

---

## Reference line trust boundaries (v0.4 / v0.3-shaped tuple)

### Governance (single on-chain address)

- **`governance`** is one `address` (constructor defaults to deployer; should be moved to a multisig/Safe via **`transferGovernance`**).
- A compromised **`governance`** can affect **policy-level** actions allowed by the contract (e.g. revoke passports alongside creator, register mint extensions, aux updates where permitted). There is **no** on-chain timelock in the reference bytecode — operate multisig and procedures off-chain.
- **`deployer`** alone can **`freeze()`** (irreversible stop to new writes). **Stable v1 is planned to omit this mechanism** (see [`docs/IDEAS_V1.md`](IDEAS_V1.md)).

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

### Optional satellite: `ODPCounterfeitConcern` (v0.4+)

- Deployed **separately** from the main registry; constructor **pins one** `ObjectDigitalPassport` address. Static pages use **`NET.counterfeitConcern`** — a **wrong address** means **wrong or empty** reads.
- **Only P and M** profiles may **`raiseCounterfeitConcern`** / **`clearCounterfeitConcern`** for a given `passportId`. Only the **same prover** profile that raised a flag may clear it (see custom errors **80–82** in **[`web/frontend/localization/ru/RELEASE_v0.4.md`](../web/frontend/localization/ru/RELEASE_v0.4.md)**).
- The chain stores **`reasonHash`** (and optional audit fields per deployment), **not** the full free-text reason. Treat as **institutional opinion** bound to that registry and timestamp, not as universal truth.

---

## Known risks and mitigations (carried forward)

### 1. Social engineering and phishing

**Risk:** Fake verifier site; fake “official” P/M institution; malicious `dataUrl` / `noteUrl`; **misleading interpretation** of a concern flag as “certified fake”.

**Mitigation:**

- Compare fetched content to on-chain hashes locally.
- Treat profile IDs as opaque strings; verify them on **official** sites.
- Do not trust `noteUrl` without domain checks.
- For **concern** flags: read **which profile** raised them and **when**; confirm policy out-of-band if decisions matter.

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

Same as v0.1: **`freeze()`** only; cannot alter historical records. Protect offline. **Stable v1 is planned to omit registry-wide `freeze()`.**

---

## Verifier checklist (for users)

When verifying an object:

- [ ] **Chain and contract:** you are connected to the intended network and registry address (or known-good deployment); if using **concern** data, **`NET.counterfeitConcern`** matches the deployment you trust.
- [ ] Passport ID matches QR / bundle (`humanId` / `passportId`).
- [ ] Passport data status shows **AUTHENTIC** (hash check succeeded).
- [ ] **`creatorId`** matches what the issuer publishes on an **official** site.
- [ ] For **P** or **M** profiles — the ID is **not** proof of identity on-chain; confirm on the institution’s official channel.
- [ ] If **`mintAgent`** is shown non-zero — understand a delegate executed the mint; **`creator`** is still the issuer wallet on record.
- [ ] Proof records — find each **`creatorId`** on the institution’s site if you rely on proofs.
- [ ] NFC — challenge-response where applicable; numbered seal — visual compare.
- [ ] `dataUrl` / image URLs — legitimate domains; verify file hashes where offered.
- [ ] **Concern flag (if present):** confirm the **prover** profile ID and that your tool reads the **same** main + satellite addresses as the issuer’s deployment.

---

## Protocol options outside the main registry

Described in **[`SPEC.md`](../SPEC.md)**:

- **Global uniqueness of passport `dataHash`** — would forbid two mints with the same JSON anchor hash; product tradeoff. **Not implemented**, roadmap alignment only.
- **Optional author attestation (EIP-712)** — a separate author key attests to a passport's `dataHash` + `creatorId` binding, independent of the wallet that minted. **Deployed** as the `ODPAuthorAttestation` satellite (SPEC §7 for the address); the main registry itself performs **no** attestation checks, so this is a property of that satellite, not of the registry.

**What an author attestation does and does not prove.** It proves that whoever controls the attesting key signed *those exact bytes* for *that passport on that registry* — the EIP-712 domain binds the signature to this chain and this satellite address, so it cannot be replayed elsewhere. It does **not** prove authorship in any legal sense, and it does **not** vouch for the key holder's real-world identity: as everywhere else in ODP, an ID is only as trustworthy as the issuer's own published channels (§3).

**Reading attestations safely:** an attestation is meaningful only while its stored `dataHash` still equals the passport's current on-chain `dataHash` — verifiers MUST compare the two before showing it. Its absence is **not** a negative signal: attestation is optional and most passports will not carry one. Submission is restricted to the passport's `creator` or `owner` so a third party cannot squat the single, one-shot attestation slot with a key of their own.

---

## Third-party static analysis (e.g. Remix)

**Informal snapshot only — not a substitute for a professional audit.**

A pass through **Remix** (or similar IDE/static tooling) on the reference **`ObjectDigitalPassport.sol`** reported **no major on-chain issues** immediately suggesting direct theft or classic scam patterns, and noted sensible patterns: **custom errors**, **input validation**, **role checks** (`governance`, creator, owner paths), **`notFrozen`** on writes, and limited reentrancy surface on core paths.

**Scope note:** operators who deploy **`ODPCounterfeitConcern`** should include that artifact in their review process; it is a **separate** contract with its own trust boundary (paired main registry address).

**Limits of this class of tools:** they do **not** model **off-chain** trust (`dataUrl` / hosted files), **governance** policy (malicious extensions, revocation power), **economic** abuse (e.g. a **mint agent** burning a principal’s **C/B** monthly quota), or deployment/configuration mistakes. **`mint*ViaExtension`** uses **`staticcall`** into **governance-approved** extension contracts — not classic reentrancy into this registry, but a **trust boundary** on the extension’s correctness.

Treat **formal verification**, **timelocks** for governance (off-chain multisig process if bytecode stays minimal), and **event** consistency as **production hardening**, not conclusions from a single static run.

---

## Reporting security issues

Open an issue at:
[https://github.com/object-digital-passport/object-digital-passport/issues](https://github.com/object-digital-passport/object-digital-passport/issues)

For sensitive disclosures, use **[GitHub private security advisories](https://github.com/object-digital-passport/object-digital-passport/security/advisories)** for this repository.
