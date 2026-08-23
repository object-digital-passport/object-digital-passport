# NFC seal chips and public verification: what the NTAG 424 still has, what asymmetric silicon you can actually buy, and what cryptography cannot do

*Research note. **Non-normative.** The binding rules are [`SPEC.md` §6](../../SPEC.md#6-physical-seal) (Method A, the `nfc` anchor, and the `odp-ntag424-ev2-symmetric-cr-v1` profile) and [`SPEC.md` §11](../../SPEC.md#11-verification-algorithm) (Level 2A). This document is evidence and criticism, not a decision.*

*Status: draft · Compiled 2026-08 · Scope: the three questions "what more can the 424 do", "what asymmetric NFC parts are sold as components", and "can a verifier check a symmetric response without the key".*

---

## 0. How to read the citations

Every factual claim below carries one of these markers:

| Marker | Meaning |
|---|---|
| **[primary]** | First-party: the vendor's own datasheet, application note, or product documentation, read directly |
| **[secondary]** | Reported by a third party; used only where no primary source could be reached, and labelled as such |
| **[observed]** | Directly observed by the author on a live page or a downloaded file, 2026-08 |
| **[unverified]** | Could not be confirmed at all; stated as an open question, not as fact |

Claims that are neither cited nor observed but derived by argument from cited facts are marked **[reasoning]**. There are a few of them and they carry the weight of the recommendations, so they are flagged rather than blended in.

---

## 0.1 Warnings — read before trusting anything below

**Four things went wrong during this research and each of them would mislead a reader who did not know.**

1. **`nxp.com` returns HTTP 404 to automated document fetches from this environment, but `nxp.com.cn` serves the identical PDFs.** Every NXP datasheet and application note cited here — the NTAG X DNA datasheet, AN12196, AN12321, the NT4H2421Gx/Tx datasheets — was retrieved from `https://www.nxp.com.cn/docs/en/...` **[observed]**. The documents are the English originals with NXP's own revision headers and none carries a confidentiality restriction marker; the NTAG X DNA datasheet is `Rev. 3.2 — 6 July 2026`, the 424 TT datasheet is `Rev. 3.0 — 31 January 2019`, AN12196 is `Rev. 2.0 — 4 March 2025` **[observed]**. Anyone repeating this work should go to the `.cn` mirror first rather than concluding the documents are unavailable.

2. **`arx.org` and `docs.arx.org` were unreachable, but the vendor's own documentation repository `github.com/arx-research/arx-docs` is public and served the same pages.** The HaLo overview was read from `raw.githubusercontent.com/arx-research/arx-docs/main/pages/HaLo/overview.mdx` **[observed]**. The `store.arx.org` storefront *was* reachable.

3. **Distributor pricing is behind bot protection and the one number that came through contradicts itself.** `digikey.com` product pages return a Cloudflare interstitial to plain HTTP clients; `mouser.com`, `octopart.com`, `oemsecrets.com`, `uk.farnell.com` and `au.element14.com` either 403 or time out **[observed]**. One DigiKey page did render through a different fetch path, and it reports the NTAG X DNA wafer part `NT4PMDJU32/20031CZ` with a **part status of "Not For New Designs"** — for a chip NXP launched in 2025 and whose datasheet was revised in July 2026 **[observed]**. That is almost certainly a distributor data error, but it is quoted here exactly as seen and **must be confirmed with NXP before anyone designs around this part number**.

4. **The phrase "asymmetric NFC tag" is used by vendors for two completely different things and the marketing pages do not distinguish them.** A *static originality signature* — a fixed ECDSA signature over the chip UID, burned in at the factory and freely readable — is asymmetric cryptography and proves nothing about liveness, because it can be read once and replayed forever. A *card-unilateral authentication* — the chip signs a challenge the verifier just invented — is a different capability. NXP's Read_Sig, ST's TruST25 and EM's "digital signature" option are all the first kind; ST's own application note says so in as many words **[secondary, see §3.6]**. **ODP already knows this about NXP's originality signature** (`SPEC.md` §6 calls it "adjacent manufacturer evidence only"). The same trap is waiting in every other vendor's datasheet, and this note keeps the two apart explicitly in every row of §3.

---

## 0.2 What could not be verified

Stated up front so the recommendations are read with the right confidence:

- **Per-unit price of the Infineon OPTIGA™ Authenticate NBT bare chip.** Confirmed stocking at Mouser since September 2025 **[secondary]**; only the development kit ($150.60) and shield ($63.09) prices could be read **[secondary]**. The chip price is **[unverified]**.
- **Per-unit price of NTAG X DNA in the packaged variants** (`NT4PLDJUK` WLCSP, `NT4PLDJHN2` HVQFN). `element14`/Farnell list `NT4PLDJUK/20038YZ` **[secondary]** but every attempt to read the price table timed out. **[unverified]**
- **Any price for Infineon SECORA™ Blockchain.** Not carried by any distributor found; module delivery forms are sold through Infineon sales. **[unverified]**
- **Whether the OPTIGA™ Authenticate NBT can generate an ECC key pair on-die.** The command set in the brand-protection guide (SELECT, READ/UPDATE BINARY, PERSONALIZE DATA, CHANGE/UNBLOCK PASSWORD, AUTHENTICATE TAG, GET/SET CONFIGURATION) contains no key-generation command, and both the guide and the extended datasheet instruct the customer to *load* a customer-generated key **[primary]**. That is strong but it is an argument from absence across two documents, not a positive statement that generation is impossible. **[unverified]**
- **Whether any tag converter has shipped an NTAG X DNA inlay, label or sticker.** Searched across GoToTags, ShopNFC, Seritag, RFID Label, RFID Solution, Atlas RFID, Avery Dennison/Smartrac and Identiv catalogues, 2026-08: **none found**, while all of them list NTAG 424 DNA products **[observed]**. Absence of a search result is not proof of absence.
- **Prices at exactly 100 / 1 000 / 10 000 units** are available for NTAG 424 DNA converted tags (§3.1) and for nothing else. Every other price in this note is either a wafer-quantity figure or absent.
- **`iso.org` for ISO/IEC 9798-3**, which NTAG X DNA's asymmetric authentication cites as its basis, is paywalled and was not read. **[unverified detail]**

---

## 1. The question in one paragraph

ODP publishes the NTAG 424 DNA's 16-byte AES key inside the `nfc` anchor because symmetric verification requires the verifier to hold the key, and ODP refuses to put a server in the loop. The cost is that anyone who reads the passport can clone the seal. The three exits are: (a) get more out of the 424 without publishing the key, (b) move to silicon that holds a private key and signs a challenge, (c) find a cryptographic trick that makes symmetric verification public. This note works them in that order and the short answer is that (b) exists, is buyable, and is not a platform — and that (c) does not exist, though a weaker relative of it does.

---

## 2. What more the NTAG 424 DNA can do

### 2.1 The full capability inventory

From the NT4H2421Tx datasheet (`NTAG 424 DNA TT`, Rev. 3.0) and AN12196 (Rev. 2.0), both **[primary]**:

| Capability | What it is | Useful to a keyless verifier? |
|---|---|---|
| **AuthenticateEV2First / NonFirst** | 3-pass AES-128 mutual challenge-response. The reader must decrypt the chip's `RndB` to proceed, so **the reader cannot complete a single step without the key** | No |
| **SDM / SUN** | On each tap the chip mirrors UID + read counter into the NDEF and appends a CMAC, readable by any phone with no app on Android | Not by itself — see §2.4 |
| **SDMReadCtr** | 24-bit monotonic tap counter, resets only when SDM is re-enabled by an authenticated `ChangeFileSettings` | Partially — see §2.3 |
| **SDMReadCtrLimit** | Optional hard ceiling; past it the chip refuses further SDM reads | Yes, as a budget — see §2.5 |
| **Five AES-128 application keys** (`00h`–`04h`) plus the pseudo-keys `E` (free) and `F` (never) | Per-file and per-function access control | Yes, and ODP is currently using the wrong one — see §2.2 |
| **Tag Tamper (TT models)** | Detection loop; once opened, the status is irreversible and can be mirrored into the SDM-protected NDEF | Yes, if the key that gates `GetTTStatus` is chosen well |
| **LRP mode** (AN12321) | A leakage-resilient wrapper around AES for side-channel resistance; also the only mode in which the four AES `OriginalityKey`s can be used | No — the originality keys are NXP's, not the verifier's |
| **ECC originality signature** (`Read_Sig`) | 56-byte ECDSA over the UID on `secp224r1`. NXP publishes the verification public key in AN12196 §7 (`048A9B380AF2EE1B98DC417FECC263F8449C7625CECE82D9B916C992DA209D68`) | No — it is static and freely readable, therefore replayable |
| **Random ID** | Privacy option, hides the real UID until authenticated | No |

Two of these deserve their own sections.

### 2.2 ODP publishes the *master* key, and it does not have to

`SPEC.md` §6 tells the issuer to load "the EV2 application key you will publish… **typically 16-byte AES key 0x00**", and `ISSUER_NFC_FLOW.md` describes the provisioning step as yielding "16-byte EV2 application key (`nfcPublicKey`)" **[primary, ODP]**.

Key `00h` on the NTAG 424 is the **AppMasterKey**. The datasheet is unambiguous: *"A successful authentication with the AppMasterKey is required to change any application key including the AppMasterKey itself with the `ChangeKey` command"* (§8.2.4.1) **[primary]**. Every other AES key on the chip — `SDMMetaReadKey`, `SDMFileReadKey`, `TTStatusKey` — is one of keys `00h`–`04h`, selected by configuration, and each is changeable *only* under an AppMasterKey session (§8.2.4.2–8.2.4.5) **[primary]**.

So today, an attacker who downloads a `.odpass` bundle can:

1. clone the seal (the acknowledged risk), **and**
2. walk up to the genuine object and **re-key it** — rotate all five keys to values only they know, rewrite the NDEF, change file settings, and permanently lock the owner out of their own seal.

(2) is not in `SPEC.md`'s honest-limits paragraph, and it is strictly avoidable. Publishing `SDMFileReadKey` set to, say, key `02h`, while keeping key `00h` secret, gives a verifier everything the current design gives them for SUN verification and gives an attacker no write authority at all. **[reasoning, on primary facts]**

This is the cheapest security improvement available to ODP and it does not require a new profile, a new chip, or a spec version bump — only a change of which key number the issuer loads and publishes.

### 2.3 What the tap counter buys a verifier who already has the key

Almost nothing, and NXP says so directly. The 424 TT datasheet §9.3 lists the residual risks of SDM and the mitigations, and the first mitigation is:

> *"Track SDMReadCtr per tag at the verifying side. Reject SDMReadCtr values that have been seen before or that are played out-of-order. **This is a minimum requirement any verifier should implement.**"* **[primary]**

"At the verifying side" means state. A stateless verifier — which is what ODP's premise requires — sees a counter value and has nothing to compare it against. The counter therefore buys a stateless ODP verifier exactly one thing: **within a single scanning session, consecutive taps must show strictly increasing values**, so a clone that replays one captured message fails the second tap. That is a real check, it costs nothing to implement, and it is worth writing down. It is not replay protection.

There is one place ODP *could* put the state without a server: the passport itself. Recording the counter value observed at issuance in the `nfc` anchor gives every future verifier a floor (`observed > issuanceCounter`) that is integrity-anchored by `dataHash`. It catches a clone built from a message harvested before the passport was minted, and nothing else. **[reasoning]**

### 2.4 Different keys for different parties: what the five slots can and cannot do

The question was whether the five key slots allow a split where one key is published for public liveness checking and another stays secret for a stronger check. Mechanically, yes — the file access rights (`SDMMetaRead`, `SDMFileRead`, `SDMCtrRet`, and the TT status key via `SetConfiguration` option `07h`) each independently select one of keys `00h`–`04h` **[primary]**.

Cryptographically, **the split does not solve the cloning problem**, and it is important to say why in one sentence: any key that is published is a key with which a $10 card emulator can compute the chip's answers, and neither the UID nor the originality signature stops that, because both are static values that the emulator replays alongside them. **[reasoning]**

What the split *does* buy is real but bounded:

- it removes write authority from the published key (§2.2);
- it lets a verifier read authenticated TagTamper status with a non-master key;
- it means a future high-assurance profile could keep key `00h` in escrow with the issuer for an authenticated re-inspection that a passing verifier cannot perform.

That last point is the honest version of "two-tier verification": tier one is public and clonable, tier two requires the issuer. ODP should not pretend tier two is available to the buyer in a shop.

### 2.5 A construction that gives key-free verification on the 424 you already specify

This is the most interesting thing in §2 and it needs its own honesty warning: **no published precedent for it in the NFC-authentication literature could be found** **[unverified]**, so it should be treated as an idea to be reviewed, not as a known-good scheme.

**The observation.** The SUN message is fully deterministic. From AN12196 §3.4.4 **[primary]**:

```
SV1        = C33C 0001 0080 || UID || SDMReadCtr || [zero padding]
K_SesSDM   = CMAC(SDMFileReadKey, SV1)
SDMMAC     = MAC_t(K_SesSDM, DynamicFileData[SDMMACInputOffset .. SDMMACOffset-1])
```

Given the key, the UID, and a counter value, the issuer can compute the exact bytes the chip will emit at that counter — *before shipping*. The one nondeterministic element in the 424's SUN output is the random padding inside the **encrypted** PICCData mirror, and AN12196's own footnote says that padding *"is only relevant if `SDMReadCtr` is not mirrored"* **[primary]**. Configure the plain PICCData mirror (UID and counter in the clear — both already public in the `nfc` anchor) and the whole output is precomputable.

**The scheme.**

1. Issuer provisions the tag with a secret `SDMFileReadKey` (not key `00h`, per §2.2) and **never publishes it**.
2. Issuer precomputes the SUN output for counters `1 … N`, hashes each one, and builds a Merkle tree over the `N` leaves.
3. The Merkle root goes in the `nfc` anchor and is bound on-chain by `dataHash` / `anchorsHash`. The leaf list — 32 bytes × `N`, so 3.2 MB at `N` = 100 000 — goes in the `.odpass` bundle, which `SPEC.md` §15 already defines as the offline container.
4. Issuer sets `SDMReadCtrLimit = N` so the chip stops emitting past the published list.
5. A verifier taps the tag, reads counter `n` and the SUN bytes, hashes them, and checks Merkle membership at leaf `n` against the anchored root. **No key, no server, no third party.**

**What it fixes.** The attack ODP currently has — *read the passport file, mass-produce clones, from anywhere, at zero marginal cost* — disappears. The bundle contains hashes; hashes yield no key.

**What it does not fix, stated plainly.** An attacker with physical access to the genuine tag can tap it `k` times and harvest `k` consecutive valid messages, then answer `k` subsequent verifications from a clone. A stateless verifier cannot distinguish a harvested-but-unused counter from a fresh one. So the scheme converts a **remote, unlimited, zero-cost** attack into a **local, per-object, tap-by-tap** one. That is a large improvement and it is not the same as security.

Three secondary properties are worth having:

- The tap budget is finite and publicly known, so harvesting is a **denial of service against a specific object** rather than a silent forgery capability — the genuine tag runs out.
- A harvest is visible: the genuine tag's counter jumps far above what the object's history explains, and any later honest verifier sees it.
- The multi-tap check from §2.3 composes: `k` harvested values survive at most `k` consecutive taps.

**Cost.** `N` AES operations at issuance (trivial), 32·`N` bytes in the bundle, and the requirement that the NDEF be laid out with SDM enabled — which `ISSUER_NFC_FLOW.md` already flags as needing NXP tooling rather than the Android companion's operator write **[primary, ODP]**.

### 2.6 NTAG 424 DNA prices, for the comparison baseline

All **[observed]** on live storefronts, 2026-08:

| Product | Vendor | 10 | 100 | 500 | 1 000 | 10 000 |
|---|---|---|---|---|---|---|
| NTAG 424 DNA wet inlay, 25 mm circle | GoToTags (US) | $0.90 | $0.77 | — | $0.68 | $0.45 |
| NTAG 424 DNA sticker, ø22 mm | ShopNFC (IT) | €0.92 | — | — | — | €0.49 from 8 000 |
| NTAG 424 DNA PVC card | ShopNFC (IT) | €1.59 | — | — | — | €0.49 from 6 000 |
| **NTAG 424 DNA TT tamper tag, 45×30 mm** | **Seritag (UK/EU)** | **€1.56** | **€1.43** | **€1.21** | **€1.09** | €1.05 from 2 000 |

Note the TagTamper premium: roughly **2× the plain 424** at every quantity. And a caveat from the same vendor: Seritag states it does not stock the NTAG424 TT as a standard line because tamper designs "tend to require custom design" **[secondary]**. RFID Label lists several NTAG 424 DNA TT label formats but shows "Contact sales" instead of a price table **[observed]**. **TagTamper is buyable in Europe at label prices, but it is a semi-custom product, not a shelf item.**

---

## 3. Asymmetric NFC parts sold as components

The test applied to every candidate, in order:

1. **Component, not platform** — can you buy the part, provision it with your own key, and design around it without joining anyone's registry, API or ecosystem?
2. **Private key never leaves the die** — ideally generated on-die.
3. **Signs a verifier-supplied challenge** — not a static factory signature.
4. **Reachable by a phone over NFC alone**, with no contact interface and no external power.
5. **Buyable in Europe** at something near label prices.
6. **Tamper-evidence** — a TagTamper-equivalent permanent flag.

### 3.0 Summary

| Part | Platform-free? | Key on-die? | Signs a live challenge? | Curve | Phone-only over NFC? | Tamper? | Price |
|---|---|---|---|---|---|---|---|
| **NXP NTAG X DNA** | **Yes** | **Yes, generated on-die, non-exportable** | **Yes** (`ISOInternalAuthenticate`) | P-256 / brainpoolP256r1 | **Yes** | **Yes** (wired loop on GPIO1) | $0.747/die at one wafer (170 935 pcs) **[observed]**; converted tags: none found |
| **Infineon OPTIGA™ Authenticate NBT** | **Yes** | Loaded by the customer, not generated on-die **[unverified]** | **Yes** (`AUTHENTICATE TAG`, INS `88h`) | NIST P-256 | **Yes**, passive | No | **[unverified]**; kits $63–$151 |
| Infineon SECORA™ Blockchain | Partly — Java Card applet + Infineon sales | Yes (key pair generation is a stated feature) | Yes | secp256k1 | Yes (contactless module forms) | No | **[unverified]** |
| Microchip ATECC608B | Yes | Yes | Yes | P-256 | **No — I²C / single-wire only** | No | ~cheap, **[unverified]** |
| NXP SE05x / A71CH | Yes | Yes | Yes | P-256 etc. | **No — I²C only** | No | n/a |
| ST ST25TN / TruST25 | Yes | n/a | **No — static signature over UID** | P-256 | Yes | No | label prices |
| ST ST25TA-E "Edge TruST25" | **No — ST service** | — | Dynamic, but service-tied | — | Yes | No | **[unverified]** |
| EM Microelectronic EM4425 (em&#124;echo-V) | Yes | n/a | **No — AES-128 + optional static signature** | — | Yes | No | label prices |
| Silicon Craft SIC43NT | **No — server verification** | n/a | **No — rolling code (Mickey V1 stream cipher)** | — | Yes | Pin-configurable tamper detect | label prices |
| Arx HaLo | **No — platform, and keys are factory-generated** | Yes | Yes | secp256k1 | Yes | No | $49 per 2× or 10× pack **[observed]** |

### 3.1 NXP NTAG X DNA — the part that answers the question

Everything in this subsection is **[primary]** from the NTAG X DNA product datasheet, Rev. 3.2, 6 July 2026, 228 pages, retrieved from the `.cn` mirror.

**It signs a challenge you choose.** §6.4.3.3, `ISOInternalAuthenticate`, and the protocol table in §6.4.3.4:

```
PCD                              PICC
knows Pub.B                      knows Priv.B

generate RndA
      ── OptsA || RndA ────────►
                                 generate RndB
                                 Sig.B = ECDSASign(Priv.B,
                                     SHA256(0xF0F0[||OptsA]||RndB||RndA))
      ◄── RndB || Sig.B ────────
ECDSAVerify(Pub.B, …, Sig.B)
```

This is a two-pass unilateral authentication after ISO/IEC 9798-3. The chip mixes in its own `RndB` so the reader cannot fully control what gets signed — the datasheet calls that out explicitly and contrasts it with the generic signing available via `CryptoRequest`. The APDU is `CLA 00 / INS 88`, an ordinary ISO 7816-4 command over ISO-DEP; AN14137 shows a full trace of it **[primary]**. That means Android `IsoDep.transceive` and iOS `NFCISO7816Tag` can both drive it with no vendor SDK **[reasoning]**.

**The private key is generated on the die and cannot come off it.** §6.8.1.1, `ManageKeyPair`: up to five ECC key pairs; *"During key pair generation, the private key is securely stored on-card and the public key is returned to the caller."* §6.8.1.3: *"NTAG X DNA does not support exporting private keys."* The datasheet even warns that if you lose the public key returned at generation time you cannot recover it. **This is the exact property ODP's `nfc` anchor wants: the issuer receives a public key, publishes it, and there is nothing secret in the passport file at all.**

**Curves and crypto.** AES-128/256, ECDSA and ECDH over NIST P-256 and brainpoolP256r1, SHA-256/384, HMAC, HKDF. Common Criteria EAL 6+ with AVA_VAN.5 at product level.

**It has a tamper loop.** §6.15 "Tag Tamper Protection": four pads, two for the antenna and two for a detection wire; the status is measured on the first ISO 14443-4 command after activation; `TTPermStatus` takes ASCII `C` (closed, `0x43`), `O` (open, `0x4F`) or `I` (not enabled, `0x49`); and *"The TTPermStatus cannot be reset to Close anymore."* The status can be mirrored into the NDEF and protected by SDM. Two caveats the datasheet raises itself: the feature ships **disabled** and must be turned on with `SetConfiguration` option `0x11`, and because the tag is passive it can only measure when powered, so *"there remains a residual risk of opening and fixing a seal in between measurements going unnoticed."* This is a **chip capability requiring a converter to route the wire**, not an off-the-shelf SKU the way `NT4H2421Tx` is for the 424.

**It also does asymmetric SUN.** §2.2 lists *"SUN (Secure Unique NFC) message with AES encryption and ECDSA signature or AES CMAC"*, and §6.4.8.11 defines `SDMSIG = ECDSASign(Priv.x, DynamicFileData[...])`. A phone tapping the tag opens a URL carrying an ECDSA signature over the mirrored UID and counter, verifiable with the anchored public key and no app on Android. For ODP this is a **second, app-free verification tier**: weaker than the live challenge (it is replayable, exactly as in §2.3) but available to any passer-by with any phone.

**One trap to configure around.** §6.8.1.2, `KeyUsageCtrLimit`: each ECC private key can be given a usage cap, and *"If the configured KeyUsageCtrLimit has been reached, the related ECCPrivateKey will be disabled."* The datasheet names the denial-of-service risk and suggests a limit around one million. For a passport meant to outlive the issuer, **the limit should be left disabled**, or a hostile stranger with a phone can burn a seal to death by tapping it. **[primary + reasoning]**

**Provisioning is yours.** §2.2: *"ECC key generation on the IC, and provisioning item level certificate(s) in NXP, **or in the field**."* NXP will pre-provision UIDs and certificates and ship you the list if you want that; it is an option, not a gate. Nothing in the command set requires an NXP cloud, registry or API. **This part passes the component test.**

**Availability and price — the weak point.**

| Part | Package | Where seen |
|---|---|---|
| `NT4PLDJUK` | WLCSP, 17 pF | NXP ordering table §3; listed at element14 as `NT4PLDJUK/20038YZ` **[secondary]** |
| `NT4PLDJHN2` | HVQFN, 17 pF | NXP ordering table §3 |
| **`NT4PMDJU32`** | **FFC — sawn wafer, 50 pF** — the inlay-making form | DigiKey as `NT4PMDJU32/20031CZ` |

DigiKey shows `NT4PMDJU32/20031CZ` at **$0.74736 per unit with a single price break at 170 935 units** ($127 749.98), packaging "Bulk", and the part status *"Not For New Designs"* **[observed]** — see warning 3 in §0.1. The evaluation board `NTAG-X-DNA-EVAL` is **$42.00 for a 3-pack**, out of stock with a November 2026 restock date **[observed]**.

So the die is roughly **1.7× the price of a finished 424 DNA inlay**, but the smallest purchase is one wafer and **no converter appears to have shipped an NTAG X DNA inlay, label or sticker yet** (§0.2). An issuer buying today would be commissioning a custom conversion run.

### 3.2 Infineon OPTIGA™ Authenticate NBT — the buyable second source

From the brand-protection use-case guide (Rev. 1.1) and the extended datasheet (Rev. 2.1), both **[primary]** from `infineon.com`, which was reachable throughout:

- **`AUTHENTICATE TAG` (CLA `00`, INS `88h`)** takes a challenge and returns an ECDSA signature computed with the Brand Protection Signing Key (BSK) held in a protected key store. The guide's offline flow is: read the NDEF, extract the X.509 certificate, verify it against your root CA, then send a challenge and verify the signature. **Explicitly "eliminates the need for a cloud connection or additional online services."**
- Architecture: Java Card OS, ECDSA NIST P-256, AES-128 CMAC, RNG, protected key and password stores, Type 4 Tag applet plus a CONFIGURATOR applet.
- Ships pre-provisioned with an Infineon-issued device certificate whose subject CN is the 7-byte NFC UID as a hex string. **You are told to replace it:** *"It is recommended to personalize a customer-generated Brand Protection Signing Key (BSK) to replace the initial Infineon-generated BSK."* **This part also passes the component test** — the Infineon PKI is a default you overwrite, not a registry you join.
- **But the customer's key is generated off-chip and loaded.** The guide: *"the device-specific private key (BSK) needs to be loaded into OPTIGA™ Authenticate NBT's key store."* No key-generation command appears in the documented set. For ODP this is a meaningful step down from NTAG X DNA: the issuer's tooling would hold the private key at some moment, and the security of the seal depends on that moment.
- **Package: PG-USON-8-8, 2 × 2 × 0.55 mm, tape and reel, with 78 pF on-chip tuning capacitance.** One package, no wafer or FFC form. It is a surface-mount part for a PCB or a flex antenna assembly, not a wet inlay.
- Life cycle is one-way: `PERSONALIZATION` → `OPERATIONAL`, *"the life cycle cannot be restored to PERSONALIZATION state."* Good for a seal.
- **No tamper detection.** Nothing equivalent to a TagTamper loop in either document.
- Passive operation over NFC is supported; three modes (authentication, pass-through, asynchronous transfer) **[secondary]**. Stocking at Mouser since September 2025 **[secondary]**. Bare-chip price **[unverified]**.

### 3.3 Infineon SECORA™ Blockchain — a module, not a tag

Product brief **[primary]**: a Java Card solution on Infineon's security chip, secp256k1, up to 100 key pairs, PIN/PUK, secure key backup, signature schemes for Ethereum/Bitcoin/ERC-20, delivered as **modules** for card manufacture (contactless, dual interface, coil-on-module) or as an "SPA" smart payment accessory.

Verdict: it is closer to a component than HaLo is, but it is sold through Infineon sales as a card-industry module with a Java Card applet, and no distributor carries it. Price **[unverified]**. For ODP it is a heavier, more expensive, less accessible answer to a question NTAG X DNA answers with a 50 pF wafer part.

### 3.4 Microchip ATECC608B, NXP SE05x, A71CH — right crypto, wrong interface

These are excellent secure elements: on-die P-256 key generation, non-exportable private keys, ECDSA over an external challenge. They are also **contact-only** — I²C, or Microchip's single-wire interface **[secondary]**. There is no RF front end, so a phone cannot reach them. Bridging one to NFC means adding an NFC front end and, in practice, a host MCU, which turns a €1 sticker into a powered assembly. **They are not candidates for a passive seal on a painting.** Recording them here so the option is closed explicitly rather than left open.

### 3.5 Arx HaLo — restating why it fails the test, on grounds beyond price

The maintainer's rejection was on price and on platform. Both hold, and there is a third reason worth writing down.

- **Price [observed]:** `store.arx.org` lists HaLo Chips at **$49**, offered as a 2× pack and a 10× pack. The page does not make clear which quantity the $49 buys; it says *"Reach out on arx.org for higher volume pricing."* Either reading is one to two orders of magnitude above an NTAG 424 inlay.
- **Platform:** the NDEF URI record points at `eth.vrfy.ch`, a service **[observed]**.
- **The third reason, and the decisive one for ODP:** HaLo chips *"self-generate their own secp256k1 ECDSA keypairs at the point of manufacture"* and the keypair is *"designed to be non-extractable for the life of the chip"* **[primary, via the arx-docs GitHub mirror]**. Read carefully, that means **the issuer cannot provision the chip**. Whatever key the object's passport binds to was created by Arx's manufacturing process before the issuer ever saw the part. ODP's whole registration flow in `SPEC.md` §6 — provision, verify against the live tag, then mint — assumes the issuer chooses the moment the key comes into existence. On a HaLo they do not. NTAG X DNA's `ManageKeyPair` gives that moment back to the issuer.

### 3.6 The static-signature parts, and why they are not on the shortlist

- **ST ST25TN512 / ST25TN01K with TruST25.** ST's own material describes signatures generated by ST's HSM over the UID at industrialisation, and ST's application note AN5493 states that signatures *not dynamically generated by the tag* are subject to replay: an adversary can read a tag's signature and put it on a clone **[secondary — `st.com` was unreachable, description taken from indexed summaries of ST's own documents]**. Same class as NXP's `Read_Sig`, same verdict.
- **ST ST25TA-E with "Edge TruST25".** Signatures generated dynamically on-chip — but through ST's Edge TruST25 *services* **[secondary]**. That is a platform. Out on constraint 2.
- **EM Microelectronic EM4425 (em&#124;echo-V).** Dual-frequency NFC + UHF, AES-128, and an *optional* digital signature of 256/384/512 bits **[secondary]**. The signature is a static originality artefact, not a challenge response. Interesting for logistics; not a crypto seal.
- **Silicon Craft SIC43NT.** Type 2 tag with a dynamic NDEF carrying a rolling code — 4 bytes of Mickey V1 stream cipher output over a timestamp **[secondary]**. Symmetric, short, and the vendor's own reference implementations are literally named `sic43nt-server-node` and `sic43nt-server-aspnetcore` **[observed]**. Server-dependent by construction. Out on constraint 1.

---

## 4. Can a verifier check a symmetric response without the key?

**No. This is what asymmetric cryptography is for.** The rest of this section says why the specific ideas fail, briefly, because they will be proposed again otherwise.

**Publishing `H(key)` and a proof.** There is nothing to prove. The verifier's problem is not "is this the right key" — the verifier has no key. It is "did this chip compute `CMAC(k, m)` correctly", and checking a CMAC requires `k`. A hash of the key is a commitment to a value the verifier still cannot use.

**Zero-knowledge proof of CMAC correctness.** The question "who is the prover?" ends it. The chip computes a CMAC and nothing else; it cannot produce a proof. A party holding the key could produce one — that party is a server, which is the thing ODP exists to remove. Cost is beside the point, though for the record: recent benchmarking work puts a Groth16 circuit for ECDSA verification at ~1.5 million constraints **[secondary]**, and AES circuits are in the same order; mobile-side proving in 2026 is feasible but irrelevant when there is no prover in the trust model.

**Verifiable delay functions / timed reveal.** These delay a secret becoming public. They do not create a state where a verifier can check today and an attacker cannot forge today, because both parties face the same clock.

**Splitting the key.** Shamir or XOR splits require reassembly to compute a CMAC. Anyone who can verify holds the whole key. Threshold AES evaluation between the phone and some other party reintroduces the other party.

**The one thing that does work** is not a way to verify a symmetric response without the key; it is a way to avoid needing one. Precompute the responses and publish *commitments* to them (§2.5). The verifier checks a hash and a Merkle path, not a MAC. It survives without a server, it keeps the key secret — and it buys a materially weaker guarantee than asymmetric signing, for the reasons set out there.

---

## 5. Hybrids worth naming

Two combinations are better than either half.

**H1 — cheap symmetric for reach, asymmetric for the object that matters.** ODP does not need one answer. `SPEC.md` §6 already carries two seal methods and §11 already grades assurance in tiers. A second `nfc` verification profile for NTAG X DNA is additive — the anchor's `publicKey` field is already documented as accepting "deployment-specific public verification material" for "other future NFC ICs", and the profile name `odp-ntag424-ev2-symmetric-cr-v1` is already versioned and vendor-scoped **[primary, ODP]**. A `odp-ntagx-ecdsa-challenge-v1` profile costs a spec section, not a breaking change. Keep the 424 for the €1 tag; use NTAG X DNA where the object justifies a custom conversion run.

**H2 — NTAG X DNA's own two tiers, on one chip.** The same part gives an app-free SUN read with an ECDSA `SDMSIG` (any phone, any passer-by, replayable) *and* a live challenge over `ISOInternalAuthenticate` (companion app, not replayable). That is precisely the "cheap liveness plus strong uniqueness" split the question asked for, and it needs no second chip and no second key ceremony. **[primary + reasoning]**

What is **not** worth building: a hybrid where the strong half requires the issuer to be reachable. That is a server with extra steps.

---

## 6. Where this leaves ODP

| | **Today: 424 + published AES key** | **424 + §2.2 fix + §2.5 commitments** | **NTAG X DNA + ECDSA challenge** |
|---|---|---|---|
| Verifier needs a server | No | No | No |
| Secret in the passport file | **Yes — and it is the master key** | No | No |
| Clone from the passport file alone | **Yes** | No | No |
| Clone from physical access to the tag | Yes | Yes, tap-by-tap, bounded, and it burns the tag's budget | **No** |
| Attacker can re-key the genuine tag | **Yes** | No | No |
| Replay of a captured response | Blocked (EV2 is live) | Not blocked | Blocked (live challenge) |
| App-free path for a passer-by | No | Yes (SUN URL) | Yes (SUN URL with ECDSA sig) |
| Permanent tamper flag | Yes, off-the-shelf SKU | Yes, off-the-shelf SKU | Yes, but needs a converter to wire the loop |
| Buyable as a finished tag in Europe | **Yes, €1.09–€1.56 (TT)** | Yes, same part | **No converted product found** |
| Smallest realistic purchase | 10 tags | 10 tags | one wafer, ≈171 000 dies, ≈$128 k **[observed]** |
| Certification | EAL4 (424) | EAL4 | EAL 6+ AVA_VAN.5 |

---

## 7. Recommendations

Ranked by ratio of security gained to work required. Each is one change and one reason.

1. **Stop publishing key `00h`. Change `SPEC.md` §6 and `ISSUER_NFC_FLOW.md` to require that the published key be a non-master application key (`01h`–`04h`), configured as `SDMFileReadKey` / the EV2 key, with `00h` retained secret by the issuer.** Key `00h` is the AppMasterKey and authorises `ChangeKey` over all five keys (§2.2); publishing it hands every reader of the bundle the ability to re-key and permanently brick a genuine seal, which is a strictly larger loss than cloning and is entirely avoidable. This costs one line of provisioning guidance.

2. **Write the key-publication decision down as a security decision.** `SPEC.md` §6 states the honest trust note but does not say that hosting `dataUrl` is what turns the key public, that the choice is currently per-passport and undocumented, or what an issuer who declines to host has and has not bought. A reader of the specification should not have to infer ODP's most consequential trade-off from the optionality of a field.

3. **Add a second verification profile for NTAG X DNA — `odp-ntagx-ecdsa-challenge-v1` — before anyone needs it.** The chip generates a P-256 key pair on-die, never exports the private half, and signs a verifier-chosen `RndA` via a plain ISO 7816-4 APDU (§3.1); the anchor's `publicKey` field is already specified to accept exactly this. Adding the profile now, even with no converted tag on the market, means the specification is ready the day one exists — and it converts ODP's `nfc` anchor from "here is our secret" to "here is our public key", which is the sentence the whole project is built to be able to say.

4. **Adopt the multi-tap rule in the verifier: require `SDMReadCtr` to increase strictly across consecutive taps in one session, and record the issuance counter in the `nfc` anchor.** NXP's own SDM guidance says verifier-side counter tracking is the minimum any verifier should implement (§2.3); a stateless verifier can still do the weak version of it for free, and the anchored issuance counter gives a permanent floor that `dataHash` protects.

5. **Review the precomputed-SUN-commitment construction in §2.5 before building it.** It gives key-free public verification on silicon ODP already specifies, at the cost of a bounded tap budget and a few megabytes in the `.odpass` bundle. No published precedent was found, which is a reason for review by someone else, not a reason to skip it — but it should not go into a normative section until it has been.

6. **Buy an `NTAG-X-DNA-EVAL` board and an OPTIGA™ Authenticate NBT development kit and run the two challenge protocols from the Android companion.** $42 and ~$63 respectively (§3.1, §3.2). Everything in §3 is read from datasheets; nothing has been tapped. Until a phone has driven `INS 88h` against both parts, recommendation 3 rests on paper.

7. **When quoting a conversion run, ask for the tamper loop on NTAG X DNA explicitly.** The tamper feature exists on the die (§3.1) but ships disabled and needs a converter to route a wire to GPIO1 and an issuer to enable it with `SetConfiguration` option `0x11`. The 424 TagTamper is a finished part; on NTAG X DNA it is a design requirement, and a converter who is not told will not build it.

8. **Leave `KeyUsageCtrLimit` disabled on any NTAG X DNA used as a passport seal, and say so in the profile.** The datasheet names the denial-of-service risk itself (§3.1). A seal that a stranger can exhaust by tapping it is not a seal for an object meant to outlive its issuer.

---

## 8. Open questions

1. **Is `NT4PMDJU32` really "Not For New Designs", or is that a distributor data error?** One DigiKey listing says so for a part whose datasheet was revised in July 2026 (§0.1, warning 3). This needs a direct answer from NXP before recommendation 3 has a part number attached.
2. **What does an NTAG X DNA inlay actually cost converted, at 1 000 and 10 000?** The die is $0.75 at wafer quantity; conversion, antenna, and the tamper loop are unpriced. **[unverified]**
3. **Will any converter run NTAG X DNA below one wafer?** The gap between "171 000 dies" and "an artist sealing forty paintings" is the single biggest practical obstacle in this note.
4. **Can the OPTIGA™ Authenticate NBT generate a key pair on-die?** Two Infineon documents say "load", neither says "cannot generate" (§0.2). If it can, the NBT moves from second choice to co-equal.
5. **What is the bare NBT2000A8K0T4 unit price at Mouser?** **[unverified]** — needed to know whether Infineon is a cheaper route than a custom NXP wafer run.
6. **Does the plain (unencrypted) PICCData mirror on the 424 introduce any nondeterminism the datasheet does not mention?** §2.5 rests on it being fully deterministic. AN12196's footnote confines the random padding to the encrypted path, but this should be confirmed against a physical tag before anything is built.
7. **Should the `.odpass` bundle carry a commitment list at all?** §2.5 would put 3.2 MB in it at `N` = 100 000. `SPEC.md` §15 does not currently anticipate payloads of that size, and the same question is open for edition unit address lists in the v0.7 line.
8. **Is there prior art for §2.5?** Nothing was found. Someone in the RFID or PUF literature has probably published a version of "commit to precomputed challenge–response pairs so the verifier needs no key", and finding it would either validate the construction or name its known break.
9. **Does NXP's optional UID-and-certificate delivery service create any dependency ODP should refuse?** The datasheet presents it as an option (§3.1) and the field-provisioning path looks complete without it, but the certificate handling in the SIGMA-I flows was not read in full. **[unverified detail]**

---

*Sources are inline. NXP documents were retrieved from `nxp.com.cn` after `nxp.com` returned 404 to automated fetches; Infineon documents from `infineon.com` directly; Arx documentation from the vendor's public GitHub mirror after `arx.org` was unreachable. Distributor pricing that could not be read through bot protection is marked `[unverified]` rather than estimated. Nothing in this note has been tested against a physical tag.*
