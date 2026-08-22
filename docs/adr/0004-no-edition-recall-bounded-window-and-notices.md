# No edition recall: a window that closes on first activation, then notices

Revocation is v0.6's only remedy for a wrong immutable card, but on an edition covering 100 000 units it is also a kill switch: revoking strips the assurance tier and blocks further events, so one transaction by the issuer — or by `governance` — would wipe the record of every honest holder. SPEC §20.13 removes recall as an ongoing power. An edition may be revoked only until the first unit of it is activated; that event closes the window permanently, for every caller. Afterwards the issuer can only add an append-only **edition notice**, which destroys nothing and must be surfaced on the edition and on every unit passport under it.

## Why the gate is one fact and not a date

The first draft gated the window on a `shippingDate` declared in the `unit_key_set` anchor. That fails because anchors are immutable and shipping dates move: a two-month production delay would either close the window while nothing had shipped, or leave it open while stock sat on shelves, and the only fix would be re-minting an edition because logistics slipped. A declared plan is not an observable fact.

The second draft added an issuer-declared shipment-start event as a second lock. It worked, but it was removed: it bought only the gap between goods reaching shelves and the first buyer scratching a label — short, and self-closing — at the cost of a second mechanism, a second event kind, and a second thing an issuer can quietly decline to do. One rule that cannot be declined beat two that can.

## Consequences

- A typo in an edition card is fixable only before the first activation. After that it is permanent, and the remedy is a corrected edition plus a notice pointing at it.
- `governance` loses any path to revoke an edition once a holder has appeared. This is deliberate: the protocol should not hold a switch over a brand's production run either.
- Residual exposure, accepted: between goods reaching buyers and the first label being scratched, the issuer's revoke right is still live. Verifiers report this as `EDITION_REVOCABLE` so it is at least visible.
- One new event kind on the edition passport, `kind = 8` (edition notice), and two verification states, `EDITION_REVOCABLE` and `EDITION_NOTICE`.
- A notice is never a verdict on an individual unit, and verifiers must not render it as one — consistent with [ADR-0003](0003-no-uniqueness-rule-for-unit-passports.md) and SPEC §20.11.
