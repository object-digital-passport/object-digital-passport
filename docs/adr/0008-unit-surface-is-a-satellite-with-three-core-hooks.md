# The unit surface is a satellite, with three hooks in the v0.7 core

The open question asked whether the §20 unit surface belongs in the v0.7 core or in a paired satellite, and the working answer was "no real difference, since v0.7 is a new contract either way". Reading `chain/contracts/ObjectDigitalPassport.sol` shows there is a difference, and that the split is not free-form: almost everything belongs in a satellite (`ODPEditionUnits`), but three things cannot live there and must be in the core.

## What must be in the core

1. **An explicit initial owner at mint.** `_passports[passportId] = Passport({… creator: principalWallet, owner: principalWallet …})` hardcodes the owner to the minting principal, and `transferPassport` is owner-only. SPEC §20.10 requires the owner to be named in the unit key's signature, which a satellite cannot deliver: it would have to mint to itself, briefly *be* the owner of a stranger's passport, and then transfer — two writes and a window nobody should have. The v0.7 mint path takes an `initialOwner`, defaulting to the principal when zero.
2. **A one-way revocation lock.** SPEC §20.13 closes the revocation window on the first activation, but activation state lives in the satellite. Rather than have `revokePassport` call out to a satellite, the satellite calls `lockEditionRevocation(passportId)` once, setting an irreversible flag the core checks. This is deliberately the safe direction: the flag can only ever be set, so even a mis-wired or hostile satellite pointer can block revocation, never enable it.
3. **Event kind 9** accepted by `recordPassportEvent`, for edition notices.

All three are small; the v0.6 core compiles to 13,309 bytes against the 24,576-byte EIP-170 limit, so headroom is not the constraint here.

## What belongs in the satellite

Opening an edition's key set (`openEdition(passportId, merkleRoot, unitCount)`, restricted to the edition's `B` creator via the registry, as `ODPCounterfeitConcern` already does for `P`/`M`), activation, unit-passport minting routed into the core mint the way `ODPExtensionMintRouter` already routes, and all the reads.

Note that the Merkle root must be registered on-chain explicitly. `anchorsHash` commits the whole anchors array as one hash, which is not something a contract can verify a proof against; the root has to exist as a plain value. Off-chain verifiers check that the registered root matches the `unit_key_set` anchor.

## Why satellite rather than core

- **`freeze()` is registry-wide.** It irreversibly blocks every state-changing path on the main registry while leaving satellites' own state alone. If activation lived in the core, freezing an abandoned experimental registry would also freeze activation for goods already in buyers' hands.
- **The activation surface is the exposed one** — permissionless writes, sponsored fees, high volume — and it should not share storage with the immutable passport core.
- **A satellite can be replaced; a core cannot.** Under the 0.x rules a core redeploy is a new registry, and existing passports do not move. A bug in the activation path should not cost anyone their passports.

## Consequences

- The v0.7 core carries a governance-set pointer to the units satellite, needed for the lock in (2). Its failure mode is one-way and safe, per above.
- The registered Merkle root and the `unit_key_set` anchor are two representations of the same fact, and a verifier must compare them. A mismatch is a tampered or misconfigured edition.
- `initialOwner` is a general core capability, not a unit-specific one. Any future flow needing mint-to-a-third-party gets it for free.
