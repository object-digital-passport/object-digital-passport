# The fourth core hook, and uniqueness per (unit, owner)

[ADR-0009](0009-unit-passport-minting-needs-a-fourth-core-hook.md) deferred the lazy unit-passport mint of SPEC §20.10 until a core hook existed whose authority was a unit-key signature rather than a registered profile. That hook is now `ObjectDigitalPassport.mintUnitPassport`, callable only by the paired `ODPEditionUnits` satellite, which verifies a signature over `(edition, unitIndex, ownerAddress)` against the edition's Merkle root before calling. `creator` becomes the edition's issuer; `owner` becomes the address the unit key named.

Implementing it forced two decisions the specification had not made.

## Monthly mint caps do not apply

Caps exist to stop a wallet spraying arbitrary records into the registry. This path cannot be sprayed the same way: every mint costs the caller a distinct printed secret from a set whose size was committed at mint time, which is a tighter bound than a per-wallet count. Applying the issuer's `B` cap would also be actively wrong — a hundred thousand buyers minting their own passports would exhaust the issuer's own monthly allowance and stop it publishing anything else.

## Uniqueness is per `(unit, owner)`, not per unit

[ADR-0003](0003-no-uniqueness-rule-for-unit-passports.md) removed the one-passport-per-unit rule because it handed whoever minted first — including the holder of a cloned code — the power to lock the genuine holder out forever. That still holds: competing unit passports are allowed and surfaced unranked.

But "no uniqueness at all" leaves nothing to stop one key minting endlessly. Keying uniqueness on `(edition, unitIndex, ownerAddress)` bounds the repeat without reintroducing the lock-out: a genuine holder names their own address, which no competing minter has claimed, so the door is always open to them. What is blocked is only re-minting for an owner that already has one.

The residual is honest and small: someone holding a genuine key can still mint many passports for their own unit by cycling addresses, paying for each. Every one of those records is visibly attached to that single unit index, so the noise is self-labelling and contained to the unit its owner already controls.

## Consequences

- A unit passport is `physical` in this revision — the object it identifies is one item of a production run.
- The satellite indexes every unit passport per unit, in mint order, and `getUnitPassports` returns all of them. Mint order is not a ranking (§20.11).
- The registry grew from 13,833 to 16,194 bytes against the 24,576-byte limit. Still roughly a third of the budget free.
