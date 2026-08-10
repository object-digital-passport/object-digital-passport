# Signed outer labels, with the signer key on-chain

The outer carrier was plaintext: a Merkle root and a unit index anyone could print, checkable only by going online. SPEC §20.7 now lets an edition carry a signature over `(chainId, contract, editionPassportId, unitIndex, merkleRoot)`, verified against a `labelSignerKey` published in the `unit_key_set` anchor and registered on-chain in `ODPEditionUnits`. It is optional per edition; a zero key means plain labels.

## Why the key is on-chain and not in a PKI

This follows the idea of **ISO/IEC 20248** — a compact signature inside the barcode, verifiable offline — but not its usual deployment, which distributes the signer's certificate through X.509/PKI or a DNS record. That would have reintroduced exactly the dependency [ADR-0004's successor work](0004-no-edition-recall-bounded-window-and-notices.md) and the address-list rule spent effort removing: an issuer domain that must still resolve years later.

ISO/IEC 20248 states that it does not specify cryptographic methods or key management methods, so putting the key in the edition passport is filling a slot the standard deliberately leaves open, not deviating from it. We do not claim conformance — the normative text is paywalled and was not read — only that the construction is the same idea with the key management the standard declines to fix.

The key travels twice, like the Merkle root: in the anchor, so it reaches an offline reader inside the `.odpass` bundle, and on-chain, so a networked verifier has an authoritative copy to compare against.

## What it buys, and what it does not

Buys: a reader in a shop, with no network, can tell that a label was printed by the issuer. Without it, a fabricated label pointing at a real edition looks correct until someone goes online, and a counterfeiter's own verification page can supply that "online" answer.

Does not buy: protection against copying. A photograph of a genuine label reproduces a valid signature. Signing stops **fabrication**; duplication is caught by activation (§20.9) and by nothing else. §20.7 says this in normative text so product copy cannot quietly upgrade the claim.

## Consequences

- The contract publishes the key and never verifies a label. Label checking is entirely off-chain, which is the point — an on-chain check would need a network and defeat the use case.
- `getEdition` returns a fifth value; the JS read layer maps a zero signer to `null` so a plain-label edition is not rendered as a broken one.
- A verifier MUST NOT treat a valid signature as an authenticity verdict, and MUST NOT rank an edition with plain labels below one with signed labels. Most issuers will print plain labels.
- The signer key is immutable with the edition. A compromised signer is announced with an edition notice (§20.13), not rotated.
