# The variant salt lives inside the sealed package

SPEC §20.4 first recommended deriving the blind-box variant salt from the unit key, so that opening a unit would yield its salt and the issuer would be out of the reveal path. That was a break, not an optimisation. §20.4 now forbids deriving the salt from the unit key, the unit index, or anything readable without opening the package, and requires it to be carried inside the seal — typically a printed card enclosed with the object.

## Why

A blind-box series has on the order of thirteen possible variants, so the commitment `SHA-256(index || variant || salt)` is protected by the secrecy of the salt and by nothing else: anyone holding the salt computes the commitment for every candidate and reads off the answer immediately. The tamper-evident layer carrying the unit key sits on the **outside** of the package, and scratching it does not open the box. A reseller could therefore scratch, derive the salt, learn the contents of a still-sealed unit, keep the rare ones, and sell the rest as "sealed, never opened" — destroying the product the feature was meant to serve.

Carrying the salt inside the seal protects the variant with the same physical barrier that protects the surprise, and it removes the issuer from the reveal path far more completely than key-derivation did: nothing has to be requested from the issuer, and rarity stays provable after the issuer no longer exists.

## Consequences

- The unit key and the variant salt are two distinct secrets guarding two distinct claims — "this unit is from the run" and "this unit contained the chase". They are now separate glossary terms and must not be conflated in interfaces.
- Packing gains one operation: the matching salt card goes in the matching box. The packer already holds that information.
- A mismatched card is fail-safe. It cannot prove a variant the unit does not have, only fail to prove the one it does.
- A lost card makes rarity unprovable permanently. An issuer may retain salts as a courtesy recovery path, but the specification forbids any part of the mechanism from depending on the issuer being reachable.
- Nothing here protects against the packer, who knows the contents by definition, or against weighing and candling — pre-existing blind-box problems outside this protocol's scope.
