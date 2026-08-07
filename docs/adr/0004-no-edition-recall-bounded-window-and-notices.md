# No edition recall: a bounded revocation window, then append-only notices

Revocation is v0.6's only remedy for a wrong immutable card, but on an edition covering 100 000 units it is also a kill switch: revoking strips the assurance tier and blocks further events, so one transaction by the issuer — or by `governance` — would wipe the record of every honest holder. SPEC §20.13 removes recall as an ongoing power. An edition may be revoked only while no unit has been activated **and** the issuer has not posted a shipment-start notice; either event closes the door permanently for every caller. Afterwards the issuer can only add an append-only **edition notice**, which destroys nothing and must be surfaced on the edition and on every unit passport under it.

## Why the gate is not a date

The first draft gated the window on `shippingDate` from the `unit_key_set` anchor. That fails because anchors are immutable and shipping dates move: a two-month production delay would either close the window while nothing had shipped, or leave it open while stock sat on shelves, and the only fix would be re-minting an edition because logistics slipped. A declared plan is not an observable fact. The two observable facts are that someone scratched a code, or that the issuer said it was shipping — so the gate uses those, and `shippingDate` is demoted to a plan used only for the §20.14 anomaly check.

"The issuer simply never posts the shipment notice" is a weak loophole: the first buyer to activate closes the window regardless, and until then every verification reports `EDITION_REVOCABLE` — an issuer selling goods while the registry advertises a live right to erase its customers' records is showing that to those customers.

## Consequences

- A typo in an edition card is fixable only before shipment or first activation. After that it is permanent, and the remedy is a corrected edition plus an edition notice pointing at it.
- `governance` loses any path to revoke a shipped edition. This is deliberate: the protocol should not hold a switch over a brand's production run either.
- Two new event kinds on the edition passport: `kind = 8` shipment start, `kind = 9` edition notice. Two new verification states: `EDITION_REVOCABLE`, `EDITION_NOTICE`.
- A notice is never a verdict on an individual unit, and verifiers must not render it as one — consistent with [ADR-0003](0003-no-uniqueness-rule-for-unit-passports.md) and SPEC §20.11.
