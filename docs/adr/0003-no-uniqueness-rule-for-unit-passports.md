# No uniqueness rule for unit passports

[ADR-0002](0002-unit-key-names-the-owner-payer-is-separate.md) introduced a guard requiring at most one unit passport per `(edition, unit index)`. We removed it. SPEC §20.10 now states that uniqueness MUST NOT be enforced: competing unit passports may exist for the same unit, and §20.11 requires a verifier to report all of them — mint time, owner, minting profile — unranked and without a verdict.

## Why

The guard looked like hygiene and was actually a weapon. A counterfeiter who cloned a real package including its code can mint first; under a uniqueness rule the holder of the *genuine* unit is then permanently unable to obtain a unit passport at all, by a single transaction from someone else. A surfaced conflict is recoverable — activation timing, issuer identity, and photographs all remain available to a human. A lock-out is recoverable by nothing.

This is also the position the project already holds. v0.6 deliberately declined to enforce global `dataHash` uniqueness on the grounds that it blocks only exact copies while handing bad actors a first-to-register weapon, and leaves competing records to be judged by people from the signals the registry surfaces. Carrying the opposite policy in §20 would have left two contradictory stances in one specification, and someone would eventually have built against the wrong one.

## Consequences

- The registry may hold more than one passport for the same physical unit. That noise is accepted as the cheaper failure mode.
- Verifiers gain a `UNIT_PASSPORT_CONFLICT` state, and §20.12 requires a conflict to be displayed at least as prominently as any assurance tier — the same treatment §11 gives an institutional counterfeit concern.
- Resolution stays human. The protocol supplies facts and refuses to rank them, including by mint order.
