# FAQ

### How much does it cost?

Registering a profile: ~$0.01. Minting a passport: ~$0.01–0.03. Verifying: **always free**. These are Polygon network fees — the ODP protocol itself charges nothing, ever.

### Do I need to understand crypto?

Only the basics: install a wallet, keep its recovery phrase safe, top it up with a couple dollars of POL. Use a dedicated wallet for ODP, separate from any savings.

### What if I lose my wallet?

Your profile ID and all minted passports **stay valid forever** — nothing on the chain is lost. But you can't mint new passports under that profile or update existing ones. There is no recovery; that's the price of no-one-in-the-middle. Back up your recovery phrase on paper.

### What if I lose the `.odpass` file?

The on-chain record (fingerprints, timestamp, issuer) survives, but the full description, photos, and files it fingerprinted are gone unless you have a copy. Treat `.odpass` like the artwork's certificate: multiple copies, safe places.

### Can a passport be faked?

The record can't be forged — but anyone can register *something* and print a QR code. That's why verification has a human step: check that the issuer's profile ID is published on their official website. A passport from an unverifiable issuer proves only that someone paid a cent to register a record.

### Can I edit a passport after minting?

Core content — no (that's the point: the fingerprint is permanent). Operational fields can be updated: the hosting link, current owner (transfer), coarse status/location, and condition notes. Institutions can add proof records over time.

### Is my data private?

Everything you put **on-chain is public forever** — including update history. Keep precise locations, personal data, and prices out of on-chain fields ([rules](https://object-digital-passport.github.io/object-digital-passport/spec/#privacy-of-current-state-fields-normative)). The `.odpass` bundle can stay fully private: mint with an empty link and share the file only with people you choose.

### Why blockchain at all?

Because the alternative is a company database. Companies close, get acquired, change terms. A public chain record outlives them — verification will work in 50 years, from any country, with no permission from anyone. And nobody (including the project author) can quietly edit history.

### Which blockchain, and can it change?

Polygon PoS (cheap, established). The protocol is versioned; each 0.x line is a separate registry. A stable v1 with defined migration rules is the target (~January 2027).

### Can I build my own app / site on ODP?

Yes — MIT license, open spec, [JSON Schema](https://github.com/object-digital-passport/object-digital-passport/blob/main/schema/passport-0.6.schema.json), reference web UI and contracts in the repo. Read the [spec](https://object-digital-passport.github.io/object-digital-passport/spec/) and join [Discussions](https://github.com/object-digital-passport/object-digital-passport/discussions).
