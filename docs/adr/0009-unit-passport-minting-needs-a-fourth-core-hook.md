# Unit-passport minting needs a fourth core hook, and is deferred

*Resolved by [ADR-0010](0010-the-fourth-hook-and-uniqueness-per-unit-owner.md) — the hook now exists.*

[ADR-0008](0008-unit-surface-is-a-satellite-with-three-core-hooks.md) listed the lazy unit-passport mint (SPEC §20.10) among the things the satellite would handle, "routed into the core mint the way `ODPExtensionMintRouter` already routes". Implementing `ODPEditionUnits` showed that is wrong. The satellite ships without it; §20.10 remains normative and unimplemented, and closing the gap needs a fourth core hook designed on its own terms.

## Why the router pattern does not carry over

`_resolveMintPrincipal` resolves the minting principal from `msg.sender`, substituting `tx.origin` when the caller is the configured extension router, and then requires that address to be either a registered creator or a confirmed mint agent for the named `creatorId`. Both branches assume a *registered profile* is behind the transaction.

A unit-passport mint has neither. The transaction is submitted by whoever carries it — a paymaster, a marketplace, the holder's own wallet — and the authority for the mint comes from a unit-key signature, not from a profile. Routing through `tx.origin` would be worse than useless here: the origin is the courier, which is exactly the party §20.9 and §20.10 say gains nothing.

So the core needs a mint path whose authority is a signature over `(edition, unitIndex, ownerAddress)` verified against the edition's Merkle root, with `creator` set to the edition's issuer and `owner` to the address named in that signature. That is a genuinely new authorization mode, not a variation of the existing two, and it deserves its own design pass rather than a hurried one.

## What ships instead

The satellite implements the surface §20 depends on most: `openEdition`, `activate`, and the reads. The three ADR-0008 core hooks are in place, including `initialOwner`, which is the half of §20.10 that the core can already express — a mint can name an owner other than the principal today; what is missing is letting a unit key be the thing that authorizes such a mint.

## Consequences

- A unit's public record is currently its activation, not a passport of its own. Everything §20.11 requires before purchase — membership, activation state, edition state — works without it.
- The bearer model and the payer/owner split (ADR-0002) are unaffected in principle and untestable in practice until the fourth hook exists.
- ADR-0008's satellite list is corrected by this record rather than edited, since the mistake is the useful part: the extension router looked like a precedent and was not one.
