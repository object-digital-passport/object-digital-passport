# Unit passport minting is always paid by the minter

The v0.7 edition model (SPEC §20) separates two actions on a physical unit: **activation**, a signature that can be published by any relayer and is therefore often free to the holder, and **minting a unit passport**, an ordinary on-chain mint. A draft of `docs/EDITION_UNIT_KEYS.md` proposed that a brand could cover the mint "for the first year after the drop" as a marketing cost. We rejected that and made the opposite rule normative: the mint is always paid by whoever submits it, and no implementation may present it as free or as included with the object.

## Why

There is no way to express brand-funded minting in the protocol. There is no escrow, no per-edition allowance, no expiry, and no sponsor role — so any such arrangement lives entirely in an off-chain service the brand runs at its discretion and can switch off without notice. That is precisely the dependency the edition model exists to remove: the whole point of committing unit keys on-chain is that verification and activation keep working when the brand does not. A "default" the specification cannot enforce, no verifier can check, and no buyer can rely on is worse than no statement at all — it manufactures the false expectation that the object came with a free passport.

The confusion was not accidental, and the fix is partly terminological. "Activation is gasless for the buyer" was true of activation and read as true of everything downstream of it. SPEC §1.1 now defines **Activation**, **Unit Passport**, and **Relayer** as distinct terms, and §20.9 states normatively that activation is not minting.

## Consequences

- An issuer that wants to absorb the cost can only run its own minting service and pay from its own wallet. That is a commercial offer by that issuer, revocable at will, and must never be described as a protocol property.
- The bearer model of §20.10 (initial owner is the unit address) now sits alongside a mint the *holder* pays for. Whether the payer and the initial owner may be different addresses is not settled by this ADR.
- Free activation remains genuinely free in the common case, but only because some relayer chooses to publish — never because the protocol guarantees it.
