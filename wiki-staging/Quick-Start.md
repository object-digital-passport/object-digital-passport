# Quick Start

> 🇬🇧 **English** · [🇷🇺 Русский](Quick-Start-ru)

## Verify an object (no wallet, no cost, 2 minutes)

1. Open the [Verify page](https://object-digital-passport.github.io/object-digital-passport/verify.html).
2. Enter the Passport ID from the object (looks like `ODP-2026-03-004829301`), or scan its QR code.
3. Read the result: the page fetches the on-chain record, downloads the passport bundle (if the issuer hosts one), and compares cryptographic fingerprints.
4. **Always do the human step too:** find the issuer's profile ID (like `C-482-930-174-005`) on their **official website or social profile**. The blockchain proves the record exists — the issuer's public reputation proves who stands behind it.

If you have the object's `.odpass` file (a ZIP the creator gives you), you can drop it into the Verify page and check it offline-style — no hosting needed.

## Register a profile (one-time, ~$0.01)

1. Get a crypto wallet (MetaMask or similar) — use a **separate wallet just for ODP**, not the one with your savings.
2. Get a little POL on the Polygon network (a few cents' worth covers many operations).
3. Open the [Profile page](https://object-digital-passport.github.io/object-digital-passport/creator.html), connect the wallet, choose your type:
   - **C** — individual creator (artist, photographer, maker)
   - **B** — brand or studio
   - **P** — proof institution (experts, auction houses)
   - **M** — museum or collection
4. You'll receive a permanent profile ID. **Publish it on your website and social profiles** — visibly. That public link is what makes your passports trustworthy.

## Mint your first passport (~$0.01)

1. Open the [Passport page](https://object-digital-passport.github.io/object-digital-passport/passport.html) and connect the registered wallet.
2. Fill in the object: title, author, short description — these become the passport's readable **on-chain card** — plus photos and the [Object ID identification anchors](Object-ID-Profile). For a physical object the **hard minimum is enforced**: at least one photo, dimensions, materials, and distinguishing features — the passport won't mint without them. A digital object needs its exact file hash.
3. A **seal is optional** (since v0.6): a numbered tamper-evident sticker or an NFC chip adds a stronger physical binding on top of the minimum (see [NFC Seals](NFC-Seals)) — recommended for high-value objects.
4. Mint. The card goes on-chain readable; everything else goes as fingerprints (hashes) — photos and details stay in your `.odpass` file. Later changes (sales, damage, restoration) are recorded as **append-only events**: added, never rewritten.
5. **Download and keep the `.odpass` bundle.** It's your passport's full content; the chain only stores its fingerprint. Host it publicly (then everyone can verify via the web), or keep it private and share on request.
6. Put the Passport ID on the object: printed, QR code, or NFC.

## Golden rules

- 📁 **Never lose your `.odpass`** — the chain can't restore it.
- 🔑 **Never lose the wallet** — profiles can't be recovered (passports already minted stay valid).
- 📢 **Publish your profile ID** on channels you control — it's the trust anchor.
- 🗺️ **Don't put exact locations on-chain** — mutable state is public forever ([privacy rules](https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md#immutable-core-vs-append-only-events-normative)).
