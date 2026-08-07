# The unit key names the owner; the payer is a separate party

Once [ADR-0001](0001-unit-passport-mint-is-always-paid-by-the-minter.md) made the unit passport mint always paid by the minter, the earlier rule that the initial owner *must* be the unit address stopped making sense: the person paying would not own what they paid for, and would need a second transaction and a second fee to transfer it to themselves. SPEC §20.10 now takes the owner from an explicit `ownerAddress` inside a message signed by the unit key, and forbids deriving ownership from `msg.sender`.

## Why

Separating payer from owner is the only shape in which all three real situations are one transaction: a buyer with a wallet mints and owns directly; a brand's minting service mints **to the buyer** instead of to itself and then having to transfer; and a holder who wants no wallet names the unit address and keeps the bearer model. Making the unit address the owner unconditionally would have preserved the bearer model at the cost of taxing everyone else twice, and making `msg.sender` the owner would have destroyed the bearer model entirely — a holder without a wallet could not get a passport at all.

## Consequences

- The bearer model becomes an option rather than the rule. Interfaces SHOULD default to the unit address when no wallet is connected, so the no-wallet path stays the easy one.
- A guard is now required that did not exist before: no mint before the unit is activated. A second guard — at most one unit passport per `(edition, unit index)` — was drafted here and then removed; see [ADR-0003](0003-no-uniqueness-rule-for-unit-passports.md).
- Ownership inherits the conflict semantics of activation. Whoever presents a valid unit-key signature first names the owner, so a cloned code can name an owner the honest holder did not choose. The protocol surfaces the conflict and does not adjudicate it — consistent with SPEC §20.11 and the v0.6 stance on duplicate passports.
