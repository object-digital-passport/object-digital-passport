# Mass-market unit authentication codes: Pop Mart, the label industry, the standards, and ODP §20

*Research note for the **v0.7** line. **Non-normative.** The binding rules are [`SPEC.md` §20](../../SPEC.md#20-edition-passports-and-unit-activation-keys-v07-line-b-profile-only); the design rationale is [`EDITION_UNIT_KEYS.md`](../EDITION_UNIT_KEYS.md). This document is evidence and criticism, not a decision.*

*Status: draft · Compiled 2026-08 · New directory: `docs/research/` did not exist before this file.*

---

## 0. How to read the citations

Not all of the sources below are equal, and the difference matters more than usual here, because this subject is drowning in SEO content that reads like documentation and is not. Every claim carries one of these markers:

| Marker | Meaning |
|---|---|
| **[observed]** | Directly observed by the author on a physical object or a live page, 2026-08 |
| **[primary]** | First-party: the standards body, the regulator, the vendor's own product documentation |
| **[secondary]** | Reported by a third party; used only where no primary source exists, and labelled as such |
| **[unverified]** | Could not be confirmed at all; stated as an open question, not as fact |

Two things are flagged loudly in advance:

1. **Several high-ranking pages about Pop Mart authentication are machine-generated and contain fabricated specifics.** Search results for this topic surface `smartbuy.alibaba.com/popmart/*` and `alibaba.com/product-insights/*` pages that cite a "Pop Mart Global Authentication Report (Q1 2026)", a "dynamic QR authentication introduced in 2023", verification domains `verify.popmart.com`, `popmart.com/verify`, `popmart.global`, and an address `fraud@popmart.com`. None of these could be corroborated against any Pop Mart property. They are treated here as **unreliable and are not cited as evidence for anything**. This is itself a finding: the informational layer around consumer code verification is polluted, which is the same weakness the phishing clone in §1.3 exploits.
2. **`iso.org`, `gs1.org` and `euipo.europa.eu` return HTTP 403 to automated fetches.** Standards text quoted below comes from the publicly indexed catalogue abstracts and from EUIPO's own guide pages; where the full normative text could not be read, that is stated.

---

## 1. Pop Mart: what the label actually does

### 1.1 Direct observation

From photographs of a real Pop Mart box, 2026-08 **[observed]**:

- The authentication element is a **holographic silver sticker applied to the box**, carrying **both** a QR code **and** a scratch-off strip, captioned `SCRATCH OFF AND VERIFY` / 开证 刮验.
- **Before scratching**, the QR is fully exposed and scannable. The opaque layer covers **only the printed digits**.
- **After scratching**, a **16-digit decimal code** is revealed, printed in four groups of four: `4988 6028 9209 1227`.
- The verification page is at **`q.popmart.com`**. It arrives **with the first twelve digits already filled in** (`4988 6028 9209`) and asks the user to type **only the last four**.
- On success the page reports: *"Verified as genuine by POPMART"*, the full sixteen digits, *"Result: Genuine."*, and a query counter rendered literally as *"This is the 1th query"*.

### 1.2 What this means arithmetically

The first twelve digits travel inside the QR code, which is **printed in the clear on the outside of the box and readable on a shop shelf before purchase**. The only value not visible before the scratch layer is destroyed is the last four digits.

| Quantity | Value |
|---|---|
| Full code space, if the sixteen digits were uniformly random | 10<sup>16</sup> ≈ 2<sup>53.2</sup> |
| Digits carried in the clear by the QR | 12 |
| **Actual hidden secret** | **4 decimal digits = 10 000 = 2<sup>13.3</sup>** |

Roughly **thirteen bits**. A guessing attacker who has photographed the outside of one box — or who has bought one box and kept its outer QR — needs on average 5 000 attempts against the server to authenticate that specific serial, and 10 000 to be certain.

The entire security of the scheme therefore rests on two things that are **not** cryptographic:

1. **Server-side rate limiting.** Pop Mart's back end must be refusing rapid repeated guesses against a serial. This is unobservable from outside.
2. **The first-query counter.** *"This is the 1th query"* is the only signal that distinguishes a fresh unit from one whose code has been used, cloned, or guessed before.

The 12+4 split buys nothing in security. It is a **pure usability decision**: four digits is what a person will actually type. That trade is only available because a server sits in the loop and can throttle. This is the single most important structural difference from ODP, and it is discussed at length in §6.1.

### 1.3 First-party confirmation: not found

**No first-party Pop Mart documentation of the 12+4 split or of the query-counter behaviour could be located.** Specifically:

- `https://q.popmart.com` and `https://q.popmart.com/?code=…` return a JavaScript shell whose only static text is `POP MART`. The verification UI is rendered client-side and was not retrievable without a browser. **[observed]**
- `https://m-gss.popmart.com/` returns a page whose only static text is `Customer Service` plus a loading placeholder — same situation. **[observed]**
- `https://www.popmart.com/us/anti-counterfeiting` returns HTTP 404. **[observed]**
- Pop Mart's 2024 annual results announcements discuss IP revenue and do not describe the anti-counterfeit label mechanism ([PR Newswire release of the 2024 financials](https://www.prnewswire.com/news-releases/pop-mart-releases-2024-financials-revenue-surpasses-13-billion-rmb-net-profit-reaches-new-peak-302412989.html)) **[secondary]**.

So: **the 12+4 split and the query counter are confirmed by direct observation only.** They are consistent with what secondary sources describe (a 16-digit code under a scratch panel, of which the last four are typed — e.g. [Cutiemalta](https://www.cutiemalta.com/pages/how-to-verify-pop-mart-blind-box), [Art Toy Familia](https://arttoyfamilia.com/blogs/pop-mart-tips/real-vs-fake-labubu-how-to-ensure-your-monsters-are-authentic) **[secondary]**), but no vendor or brand document states them.

### 1.4 A live clone of the verification page

`https://m-gss-popmart-com.neocities.org/` is a **lookalike of Pop Mart's verification page hosted on a free static-hosting service under a domain crafted to read as `m-gss.popmart.com`** **[observed]**. It reproduces the flow precisely: a twelve-digit code shown pre-filled (`4635 9021 6143`), an input asking for *"the last four digits of the code"*, and a success screen reading *"Verified as genuine by POPMART"* with the status *"Genuine. First Time Verification"*. It even reproduces the genuine advice about which channels to trust — the WeChat mini-program 泡泡玛特服务中心 for mainland China, the Customer Service page on `m-gss.popmart.com` elsewhere.

Two conclusions:

- It **corroborates** the observed 12+4 flow and the first-verification wording — but it is **not a Pop Mart source**, and cannot be cited as one.
- It **is** the attack. A counterfeiter who prints a fake holographic sticker whose QR points at this page delivers a green "genuine" result to every buyer, on every unit, forever. Against a consumer with a phone, this defeats the whole scheme without touching a single cryptographic assumption. This is the failure mode ODP's §20 is genuinely immune to, and it deserves to be said in exactly those terms rather than in the abstract.

---

## 2. How the rest of the industry builds the same thing

### 2.1 Security-label vendors

The commercial pattern is uniform. The vendor prints a serialised, unpredictable code under a tamper-evident layer; the code resolves to the vendor's cloud; the vendor's cloud answers "genuine/not" and hands the scan telemetry to the brand.

**KURZ / SCRIBOS** **[primary]** — [SCRIBOS 360](https://www.scribos.com/products/brand-protection-and-product-authentication-platform) is described as the platform where "each scan [is] automatically checked against the SCRIBOS 360 database to confirm authenticity". Their [HiddenCode](https://www.scribos.com/products/hiddencode) product is the scratch-layer variant: a "tamper-proof void effect upon initial opening", with "the visible indication of the label's first opening able to be digitally verified".

**Securikett** **[primary]** — [Secure identification and traceability](https://www.securikett.com/secure-identification-and-traceability/): "Our UID Codes are unique and cannot be guessed"; "we guarantee identifiers to be unique and not predictable". The label combines "tamper-proof labels employing VOID technology, hidden PIN codes, and various overt and covert security features". Note the architecture is the same as Pop Mart's — a public identifier plus a **hidden PIN** under the tamper layer. Securikett is also explicit about the commercial product: "Brand owners can easily monitor the number of scans and their locations through their dedicated portal."

**Authentix** **[primary]** — [DigiTrax](https://authentix.com/solution-technologies/digital-authentication/) offers "a unique, one-of-a-kind encrypted fingerprint along with a variable 2D QR code", "geo-locate detection", and a brand-facing dashboard updated in real time. The database is Authentix's, operated on the brand's behalf.

Across all three:

| Property | Industry norm |
|---|---|
| Code entropy | Vendor-asserted "unpredictable"; **no vendor publishes a bit count** **[unverified]** |
| One-time use | The code is not consumed; the *first scan* is recorded and later scans are flagged |
| First-scan record shown to consumer | Sometimes — Securikett/Authentix expose scan history primarily **to the brand**; consumer-facing first-scan wording is what Pop Mart does **[observed]** |
| Who holds the record | The vendor, or the brand |
| Documented failure modes | Not published by any vendor examined **[unverified]** |

**De La Rue** was searched for and no product-level documentation of a consumer code-verification scheme was retrieved. **[unverified]**

### 2.2 State-run "one item, one code" schemes in China

These are the closest thing to a public specification of a consumer-facing unit code, and they are worth reading because they make the opposite choice from ODP on almost every axis.

**NMPAB/T 1002—2019 《药品追溯码编码要求》** (drug traceability code encoding requirements), issued by China's National Medical Products Administration in April 2019 **[primary, via the China 2D-code registration platform mirror: [idcode.info](http://www.idcode.info/code/web/qt/qt!indexcontent.do?id=208)]**:

- Code length is **20 characters**, of which the leading 7 are the drug identifier code; alternatively an encoding conformant with ISO/IEC 15459.
- The design principle is **uniqueness per box** — 一物一码, "one item, one code" — with the code linked to marketing-authorisation holder, manufacturer, generic name, approval number, dosage form, specification, production date, batch number, expiry, and **单品序列号** (unit serial number).

The critical observation: this is a **serial number, not a secret**. It is printed openly on the carton, it is meant to be scanned by every actor in the chain, and its security value comes entirely from the **traceability database** — who scanned it, where, and in what order. Entropy is not a design parameter at all. Chinese food traceability QR guidance follows the same architecture ([Shanghai Municipal food traceability QR coding guidance, 2024](https://www.shanghai.gov.cn/sczh2/20240227/8c4d3c76cb834ced9625616f0c07962c.html) **[primary]**).

**Consequence for ODP:** the state schemes prove that "unique identifier + trusted registry" is a legitimate, deployed design. What ODP changes is *whose* registry. That is the whole argument, and it should be framed that way rather than as a claim about better codes.

---

## 3. Standards

### 3.1 ISO 22383:2020 — selecting authentication solutions

*Security and resilience — Authenticity, integrity and trust for products and documents — Guidelines for the selection and performance evaluation of authentication solutions for material goods* ([ISO catalogue entry](https://www.iso.org/standard/50285.html); ISO blocks automated fetch, abstract read from the indexed catalogue text and from [EUIPO's guide entry](https://euipo.europa.eu/anti-counterfeiting-and-anti-piracy-technology-guide/iso-223832020)) **[primary]**.

EUIPO's description: guidelines "to help enterprises decide which authentication solution is right for them by defining performance criteria and providing methods for assessing effectiveness."

What it does **not** do: it does not mandate a code length, an entropy floor, offline verification, or one-time use. It is a **procurement and evaluation framework** — it tells a brand how to compare candidate authentication elements after a counterfeiting risk assessment. **The full normative text was not read** (paywalled); the above is the scope statement only. **[primary scope / unverified detail]**

### 3.2 ISO 22384:2020 — protection plans

*Guidelines to establish and monitor a protection plan and its implementation* ([ISO catalogue](https://www.iso.org/standard/50286.html); [EUIPO](https://euipo.europa.eu/anti-counterfeiting-and-anti-piracy-technology-guide/iso-standards)) **[primary scope]**. EUIPO: guidelines "to help brands establish and monitor a plan to protect their products against different types of fraud, such as counterfeiting, copying, refill, grey market, etc." Again organisational, not technical. Note EUIPO's family listing also includes **ISO 22378:2022** and **ISO 22381:2018**, both about making independent identification and authentication systems **interoperable** — directly relevant to ODP's positioning and not currently referenced in `EDITION_UNIT_KEYS.md` §9.

### 3.3 ISO/IEC 20248:2022 — DigSig, and why it matters most here

*Information technology — Automatic identification and data capture techniques — Digital signature data structure schema* ([ISO catalogue](https://www.iso.org/standard/81314.html)) **[primary scope]**.

From the published scope: the purpose is "to provide an open and interoperable method, between automated identification services and data carriers, to read data, verify data originality and data integrity **in an offline use case**." It specifies the DigSig meta structure, the certificate parameters, and the encoder/verifier behaviour. It explicitly "does not specify cryptographic methods, or key management methods."

**This is the standard ODP §20 gestures at and does not use.** `EDITION_UNIT_KEYS.md` §9 lists ISO/IEC 20248 as a "standards touchpoint", but `SPEC.md` §20.7 defines the outer carrier as **unsigned plaintext**: an edition passport ID and a unit index, in a QR and in human-readable text. Nothing in that carrier is authenticated. See §6.3.

### 3.4 GS1 Digital Link and GS1 Digital Signatures

**GS1 Digital Link** ([GS1 standard page](https://www.gs1.org/standards/gs1-digital-link)) is a **URI syntax** for expressing GS1 keys — GTIN, and optionally batch or serial (SGTIN) — as web addresses that a resolver dereferences. It is an addressing scheme. It says nothing about entropy, secrecy, or one-time use, and it is **not** a security mechanism: a Digital Link URI is designed to be printed openly and scanned by everyone. The current release is 1.6.0 (March 2025) **[secondary — gs1.org returns 403 to automated fetch; version attribution taken from third-party implementation guides]**.

**GS1 Digital Signatures** ([GS1 standard page](https://www.gs1.org/standards/gs1-digital-signatures/current-standard)) is the piece that adds authenticity: a signature "encoded as a data attribute of an instance level identifier (e.g., serialised GTIN) in a 2D barcode or EPC/RFID tag **using ISO/IEC 20248**", with emphasis on verifying "offline, specifically where connectivity may be limited." **The normative document could not be fetched (HTTP 403); this description comes from GS1's own indexed page summary.** **[primary source, unread body]**

The important limit, and it applies to ODP equally: a signature in a data carrier proves **the carrier's data was issued by the holder of the signing key**. It does not prove the carrier was not photocopied onto another box. Copy detection is a separate problem, addressed physically.

### 3.5 EU ESPR / Digital Product Passport

Regulation (EU) 2024/1781 ([EUR-Lex, English](https://eur-lex.europa.eu/eli/reg/2024/1781/oj/eng)) **[primary]**. From the recitals as retrieved:

- The digital product passport "should be linked to a unique product identifier", alongside unique operator and facility identifiers.
- Data carriers "should be issued in accordance with internationally recognised standards" and "should be on the product itself to ensure the data remain accessible throughout its life cycle."
- **"The economic operator placing the product on the market should make available a back-up copy of the digital product passport through a digital product passport service provider that is an independent third party."**
- The passport must carry "data in a secure way, respecting privacy rules", and data "should be transferable through an open interoperable data exchange network without vendor lock-in."

**ESPR requires no entropy, no secrecy, and no one-time use.** A DPP is a *disclosure* instrument, not an authentication instrument. But the back-up clause is the single most useful sentence in the regulation for ODP's positioning: the EU has legislated the requirement that a product's record must **survive the operator's disappearance**, and has named an independent third party as the answer. That is precisely the property `SPEC.md` §20 delivers structurally rather than contractually — and `EDITION_UNIT_KEYS.md` §3.5 currently sells GS1 Digital Link as the ESPR hook while leaving the far stronger back-up argument unmade.

---

## 4. Known attacks on this class of system

| Attack | Evidence | Applies to Pop Mart | Applies to ODP §20 |
|---|---|---|---|
| **Cloned verification site** — fake sticker whose QR points at a lookalike page that answers "genuine" | Live instance observed at `m-gss-popmart-com.neocities.org` **[observed]**; also described generically by vendors **[secondary]** | **Yes, fully** | **No.** Verification resolves against a public chain; there is no answer for an attacker to forge, only a record that either exists or does not |
| **Brute force of a short secret** | 4 decimal digits = 2<sup>13.3</sup> **[observed + arithmetic]**. The general principle — a weakly enumerable identifier is brute-forceable when nothing throttles it — is documented for QR-based login in [USENIX Security '25, *Demystifying the (In)Security of QR Code-based Login*](https://www.usenix.org/system/files/usenixsecurity25-zhang-xin.pdf) **[primary, adjacent domain]** | **Yes**, mitigated only by unpublished server-side rate limiting | **No** at 100 bits; see §6.1 for why the *floor* is thinner than it looks |
| **Code cloning from a database leak or an insider** | No first-party Pop Mart statement found **[unverified]**; the structural fact that the print vendor must know every code is unavoidable and is stated in `SPEC.md` §20.14(2) | Yes | **Yes, equally.** ODP does not fix this and says so |
| **Pre-activation by an insider** — activate a whole run before shipping | `SPEC.md` §20.14(3) **[primary, ODP]** | Yes, and **not inspectable** — the log is private | Yes, but the poisoning is **publicly timestamped**, so it is at least detectable and declarable via an edition notice (§20.13) |
| **Relabelling / transplanting a genuine label onto a fake** | Vendors' entire rationale for VOID/tamper layers **[primary — SCRIBOS HiddenCode, Securikett]** | Yes, mitigated physically | Yes, mitigated **only** physically — `SPEC.md` §20.7 says so explicitly |
| **"First scan by the counterfeit buyer" poisoning** — a cloned code used first, so the genuine buyer sees "already verified" | Structural; `SPEC.md` §20.11 and [ADR-0003](../adr/0003-no-uniqueness-rule-for-unit-passports.md) **[primary, ODP]** | Yes; the brand adjudicates privately | Yes; ODP **refuses to adjudicate** and surfaces both records unranked |
| **Counterfeit physical goods reaching consumers at scale** | UK local-authority enforcement records: [Lancashire CC seized 250+ counterfeit Labubu dolls since July](https://news.lancashire.gov.uk/news/warnings-of-the-dangers-of-counterfeit-labubu-dolls), [Monmouthshire CC warning](https://www.monmouthshire.gov.uk/2025/07/mcc-trading-standards-issues-warning-regarding-counterfeit-labubu-toys), [North East Lincolnshire CC warning](https://www.nelincs.gov.uk/trading-standards-issue-a-warning-to-parents-that-potentially-dangerous-counterfeit-labubu-dolls-are-being-sold-in-the-area/) **[primary — enforcement authorities]** | The threat is real and current | — |

---

## 5. Comparison

| | **Pop Mart (observed)** | **Typical label vendor** (SCRIBOS / Securikett / Authentix) | **Chinese state scheme** (NMPAB/T 1002) | **ODP v0.7 §20** |
|---|---|---|---|---|
| **Hidden secret entropy** | **~13.3 bits** (4 decimal digits); 12 digits travel in the clear | Undisclosed; "unique and cannot be guessed" **[unverified]** | **None** — the code is an open serial, not a secret | **100 bits** printed; **≥ 80-bit floor** (§20.6) |
| **Typed by the buyer** | **4 digits** | Varies; usually a short PIN | Nothing — scanned | **25 characters** (20 payload + 5 check), or scan the DataMatrix |
| **Who is the judge** | Pop Mart's server | The vendor's cloud, on the brand's behalf | The state traceability platform | **Nobody.** A public chain records; a human decides (§20.11 no-verdict rule) |
| **First-use record public and permanent** | Shown to the consumer ("This is the 1th query"), but **private, mutable, and unauditable** | Brand-facing dashboards; consumer sees at most a flag | Chain-of-custody visible to regulators, not to consumers | **Yes** — an on-chain `UnitActivated` event with block timestamp, permanent, enumerable by anyone (`ODPEditionUnits.activate`) |
| **Survives the brand disappearing** | **No.** Server off = every unit unverifiable | **No** | Depends on the state platform | **Partly yes** — the Merkle root and activation records survive; **but** Merkle proofs need the address list, which §20.3 only *recommends* publishing. See §6.4 |
| **Buyer needs an app or account** | No — a browser | Usually no; sometimes a brand app | N/A | No for verification and activation (when a sponsor pays); **yes, a wallet and a fee** for a unit passport (§20.10, [ADR-0001](../adr/0001-unit-passport-mint-is-always-paid-by-the-minter.md)) |
| **Offline verifiability** | None | None | None | **Weak.** Membership is offline-checkable *if* you already hold the root and the address list; activation state needs the chain; the outer carrier itself carries **no signature** (§6.3) |
| **Blind-box rarity proof** | **None** | **None found** | N/A | **Yes** — `unit_variant_commit`, salt inside the sealed package (§20.4, [ADR-0005](../adr/0005-variant-salt-lives-inside-the-sealed-package.md)). **This appears to be genuinely without precedent** **[unverified — no comparable product documentation found]** |
| **Marginal on-chain cost per unit** | n/a | n/a | n/a | **32 bytes for the whole run** (one root, any `unitCount` up to 2<sup>32</sup>−1), plus one transaction per *activated* unit and one mint per *lazily minted* unit passport |
| **Label cost per unit** | Holographic sticker + scratch layer | Same order — this is the same physical product | Ink-jet code | **Identical.** ODP changes nothing about printing cost; it changes what the printed value means |

---

## 6. Where ODP is worse, or merely equal

This section exists because the comparison table above flatters ODP, and four of its rows deserve to be argued against.

### 6.1 The 80-bit floor makes the typed code six times longer than Pop Mart's, and the floor is stated wrongly

`SPEC.md` §20.6 mandates a 20-character Crockford Base32 payload plus 5 check characters — **25 characters to type**, 29 with hyphens — against Pop Mart's **four digits**. That is not a marginal usability difference. It is the difference between a code a person types from memory in three seconds and one they type wrong twice.

**The trade is real and ODP is on the right side of it.** Pop Mart can afford four digits *only* because a server rate-limits guessing, and only because Pop Mart is willing to be the judge. ODP publishes the unit address list (§20.3) and verifies permissionlessly and offline, so an attacker grinds candidate seeds locally at whatever rate their hardware allows, unobserved. §20.6 states this correctly and forbids shortening the code on usability grounds. **There is no version of this design where the buyer types four characters.** The honest framing is that the DataMatrix under the scratch layer is the primary path (§20.7) and the 25-character text form is a damaged-symbol fallback — which is exactly what §20.7 says, and exactly what interface copy will forget.

**But the floor itself is stated in a way that is quietly too weak.** §20.6 says "MUST be ≥ 80 bits". That is a *single-target* number. The attacker's real problem is a **multi-target** search: with the address list public and `unitCount` known, any one of `unitCount` addresses is a win. Expected work drops from 2<sup>80</sup> to 2<sup>80</sup>/`unitCount`.

| `unitCount` | Effective work at the 80-bit floor | At 10<sup>10</sup> key derivations/s | At 10<sup>11</sup>/s |
|---|---|---|---|
| 1 000 | 2<sup>70</sup> ≈ 1.2 × 10<sup>21</sup> | ~3 700 years | ~370 years |
| 100 000 | 2<sup>63.4</sup> ≈ 1.2 × 10<sup>19</sup> | ~38 years | **~3.8 years** |
| 4 × 10<sup>9</sup> (the §20.3 ceiling) | 2<sup>48.1</sup> ≈ 3 × 10<sup>14</sup> | ~8 hours | **~50 minutes** |

At the specification's own maximum `unitCount`, a code that satisfies §20.6's floor exactly is breakable in under a day by an attacker with a GPU cluster, and each break yields a valid activation for a real unit of a real edition. The shipped encoding (100 bits) is fine — 2<sup>100</sup>/10<sup>5</sup> ≈ 2<sup>83.4</sup> is comfortably out of reach — but the **floor** is what a future implementer will build to, and the floor is wrong. It costs nothing to fix, because the existing encoding already satisfies the corrected version.

*(Derivation-rate figures are order-of-magnitude estimates from the cost of secp256k1 public-key generation on commodity GPUs; they are engineering judgement, not a cited benchmark.* **[unverified]** *The structural point — that multi-target search divides by `unitCount` — is not in dispute.)*

### 6.2 The public activation log is a live sell-through feed, and §20.14 does not admit it

`ODPEditionUnits.activate` emits `UnitActivated(string editionPassportId, uint32 indexed unitIndex, address indexed unitAddress, uint256 timestamp)`, and `getEdition` returns `unitCount` in the clear. Anyone with an RPC endpoint can therefore reconstruct, for any edition, **in real time and for free**:

- the exact size of the production run;
- a timestamped activation curve — the cumulative count of units whose buyers have scratched a label;
- the per-unit-index pattern of that curve.

For a listed toy company this is close to market-sensitive information. Sell-through velocity by drop is the number equity analysts most want and brands most protect. The label industry's entire commercial pitch runs the other way: Securikett sells the brand a private dashboard of "the number of scans and their locations", and Authentix sells geo-located scan analytics **[primary, §2.1]**. ODP takes the same data and gives it to everyone including the brand's competitors.

Three honest qualifications, none of which dissolve the objection:

1. **Activation measures activation, not sales.** It is voluntary, buyer-driven, lagging, and sub-sampled. It is a noisy lower bound on units opened, not a revenue figure. That noise is a genuine defence and it will not comfort a CFO.
2. **This is inseparable from the feature.** The pre-purchase signal — "is *this* unit already activated?" — is the core value of §20.11 steps 1–5, and it is only meaningful if the record is publicly readable per unit. A privacy-preserving scheme that hides which index activated would destroy exactly the property that makes ODP better than a private database. This is a real, unavoidable trade-off, not an implementation bug.
3. **What *can* be fixed is index correlation.** Nothing in §20.3 or §20.7 says that unit indices must be assigned independently of physical distribution. If a brand assigns indices 0–9 999 to the EU carton and 10 000–19 999 to Japan — the natural thing to do — then the public log leaks **regional sell-through**, which is strictly more than it needs to. Requiring the index-to-carton mapping to be shuffled costs the issuer one permutation at packing time and removes an entire category of inference.

The concrete gap: **§20.14 lists six stated limits and none of them is "your activation log is public commercial data."** A brand's security team will find this in week one of evaluation. Better that they find it in the specification.

### 6.3 The outer carrier carries no authenticity at all — and ODP already names the standard that would fix it

`SPEC.md` §20.7 requires the outer carrier to make two values recoverable: the edition passport ID and the unit index, both also in human-readable text. It is unsigned. Anyone can print `ODP-…` plus `unit 42` on anything.

Against a networked verifier this is harmless — the values resolve against the chain, and a forged label produces a mismatch or an unknown edition. But it means:

- **ODP has no offline pre-purchase check.** A scanner with no connectivity learns nothing from the outer label. `EDITION_UNIT_KEYS.md` §9 lists ISO/IEC 20248 as a touchpoint precisely because it is "the barcode-industry framing of exactly this scenario" — and §20 does not use it.
- **A cloned label is free to produce** and only detectable at the moment of a network lookup, which is the same moment Pop Mart's clone attack is detectable. On this axis ODP is *equal*, not better.

Embedding an ISO/IEC 20248 DigSig — or a GS1 Digital Signature, which is the same construction wearing GS1 clothing (§3.4) — over `(editionPassportId, unitIndex, merkleRoot)` in the outer symbol would let any verifier confirm, with no network and no chain access, that this label was issued by the edition's issuer. It does not stop copying (nothing in a data carrier does), but it converts "the outer label is plaintext anyone can print" into "the outer label is a signed assertion", and it makes the ESPR/GS1 story real rather than aspirational.

### 6.4 "Survives the brand disappearing" has a hole in it: the address list

`SPEC.md` §20.3 marks `addressListUrl` **recommended**, not required, and `addressListHash` required only when the URL is set. `EDITION_UNIT_KEYS.md` §3.1 describes the list as "published as an ordinary public file next to the `.odpass` bundle (~2 MB for 100 000 units)".

But §20.11 step 2 — "rebuild or fetch the Merkle proof for that index" — **requires that list**. Without it a verifier holding only the on-chain root cannot construct a proof for any unit, and `ODPEditionUnits.activate` cannot be called at all. So the brand's disappearance is survivable only if somebody is still hosting a file the specification does not require the brand to publish, at a URL the specification does not require to be permanent.

`SPEC.md` §15 defines the `.odpass` bundle as the offline container and does not mention the unit address list. That is the natural home for it: 2 MB inside a bundle that is already designed to be mirrored, hashed, and kept. As written, ODP's strongest claim — "the passports outlive the project" — is, for editions specifically, contingent on ordinary web hosting.

### 6.5 Where ODP is merely equal

Stated plainly, so the note is not a sales document:

- **Insider knowledge of every code** — equal. §20.14(1)–(2) concede it; the label industry has the same hole.
- **Relabelling a genuine sticker onto a counterfeit** — equal. Both rely entirely on the physical tamper layer.
- **The buyer's actual behaviour** — worse. Pop Mart's flow is: scan, type four digits, green tick. ODP's flow is: scan the outer QR, read state, scratch, scan a DataMatrix, and — for a passport of one's own — connect a wallet and pay a fee.
- **Deployment reality** — ODP §20 has never been used on a physical production run. Everything above is analysis of a specification and a reference contract, not of a shipped system.

---

## 7. Recommendations for ODP

Ranked. Each is one change and one reason.

1. **Restate the §20.6 entropy floor as per-target: `≥ 80 + ceil(log2(unitCount))` bits, minimum 80.** The current single-target floor collapses to under 50 bits of real work at the specification's own `unitCount` ceiling (§6.1), and the shipped 100-bit encoding already satisfies the corrected rule, so the fix costs nothing already printed.

2. **Add a seventh stated limit to §20.14: the activation log is public commercial data.** A brand can read the run size and a real-time sell-through curve off the chain (§6.2); the mechanism cannot hide this without destroying the pre-purchase signal, so the specification should say it rather than let a brand's security review discover it.

3. **Require the unit address list: make `addressListUrl` normative in §20.3 and add the list to the `.odpass` bundle in §15.** Merkle proofs — and therefore activation itself — are impossible without it, so "the passports outlive the project" is currently contingent on a web host the specification does not require (§6.4).

4. **Sign the outer carrier with an ISO/IEC 20248 DigSig over `(editionPassportId, unitIndex, merkleRoot)` in §20.7.** Today the outer label is unsigned plaintext that anyone can print and no verifier can check without a network; `EDITION_UNIT_KEYS.md` §9 already names the standard that fixes it (§6.3).

5. **Require in §20.3 or §20.7 that unit indices be assigned independently of cartons, regions, and distribution batches.** Natural sequential assignment leaks regional sell-through on top of total sell-through, and a shuffle at packing time removes that inference for free (§6.2).

6. **Correct the sourcing in `EDITION_UNIT_KEYS.md` §2: "Pop Mart warns publicly that counterfeiters clone codes taken from stolen database entries" is unsupported.** No first-party Pop Mart statement to that effect could be found (§1.3), and the surrounding argument does not need it — the live phishing clone at a Pop Mart lookalike domain (§1.4) is a stronger and directly observable example.

7. **Rewrite the ESPR paragraph in `EDITION_UNIT_KEYS.md` §3.5 around the back-up clause, not around GS1 Digital Link.** Regulation (EU) 2024/1781 already requires a passport back-up "through a digital product passport service provider that is an independent third party" (§3.5), which is the property ODP delivers structurally — a far stronger argument than sharing a carrier format, and one a compliance officer already has a budget line for.

---

*Sources are inline. Where a claim rests on direct observation, secondary reporting, or could not be verified, it is marked in place. Standards bodies' full normative texts (ISO 22383, ISO 22384, ISO/IEC 20248, GS1 Digital Link, GS1 Digital Signatures) are paywalled or block automated retrieval; scope statements only were read.*
