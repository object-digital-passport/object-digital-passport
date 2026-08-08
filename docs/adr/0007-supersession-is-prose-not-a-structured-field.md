# Supersession is prose, not a structured field

When an edition's immutable card turns out to be wrong after the revocation window has closed (SPEC §20.13), the remedy is to mint a corrected edition and record an edition notice on the flawed one. We considered giving that notice a structured successor field so verifiers could render a link, and rejected it. A notice points at its replacement in words; the specification defines no machine-readable supersession relation, and verifiers are forbidden from deriving one or from marking a superseded edition obsolete, invalid, or lower-ranked than its successor.

## Why

Minting a corrected edition does not rescue the units already in circulation. Their keys are committed in the *old* edition's Merkle root, they verify against it, and they always will; a successor edition carries its own key set and governs later production only. So the holder of a unit from a superseded edition holds a genuine object with an honest code that passes verification — nothing about their unit changed.

A structured "superseded by" field would be rendered by interfaces as "your edition is out of date", which is a verdict on that holder's object. This project has now removed the same verdict three times over: from competing unit passports ([ADR-0003](0003-no-uniqueness-rule-for-unit-passports.md)), from mint order as an implied ranking, and from edition notices themselves ([ADR-0004](0004-no-edition-recall-bounded-window-and-notices.md)). Introducing a dedicated field for it would be inconsistent with all three.

Prose states what is actually true — "the author's name is misspelled in this edition's card; the corrected edition is ODP-…" — and no interface can compile it into a judgement.

## Consequences

- Following a supersession is a human act. A reader sees the notice, reads the successor's ID, and looks it up if they care.
- If a structured relation is ever wanted, it should be introduced as an explicit relation between passports with its own defined display rules, not smuggled in through the notice format.
