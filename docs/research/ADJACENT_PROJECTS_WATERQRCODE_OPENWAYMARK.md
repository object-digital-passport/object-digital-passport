# Two adjacent projects: WaterQRcode and OpenWaymark

*Research note. **Non-normative.** Nothing here changes [`SPEC.md`](../../SPEC.md); it is an assessment of two third-party repositories and of whether ODP should do anything about them.*

*Status: draft · Compiled 2026-08-22 · Companion to [`UNIT_CODE_AUTHENTICATION_LANDSCAPE.md`](UNIT_CODE_AUTHENTICATION_LANDSCAPE.md), which covers the commercial side of the same problem.*

---

## 0. How to read the citations

Same marker scheme as the landscape note, with one addition: everything in §§1–2 comes from the repositories themselves, so **[primary]** here means *the code, the licence file, the commit history, or the project's own specification*, not a write-up about them.

| Marker | Meaning |
|---|---|
| **[primary]** | The repository's own files, its git history, or the GitHub API |
| **[executed]** | Verified by building and running the code locally on 2026-08-22 |
| **[secondary]** | A third party's account; used only where no primary source exists |
| **[unverified]** | Could not be confirmed; stated as an open question |

Two notes on method:

1. Both READMEs were read **after** the code, not before, so that the marketing line could be checked against the implementation rather than framing it.
2. OpenWaymark's test suite and end-to-end demonstration were actually run. That matters: it is the difference between "a repository that claims to implement Certificate Transparency-style logs" and "a repository that does".

---

## 1. WaterQRcode

<https://github.com/SickCiQuattro/WaterQRcode>

### 1.1 What it actually is

A **university coursework notebook** that reproduces one published paper's copy-detection scheme in Python, evaluated entirely against a **synthetic** print-and-scan simulation. There is no library, no CLI, no API, no service — the deliverable is a single Jupyter notebook, `qrgen.ipynb`, of 27 code cells and about 2 100 lines, plus a PDF course report **[primary]**.

The README is accurate about the pipeline and quietly silent about the thing that most affects how the results should be read: the "counterfeit" samples are not photographs of reprinted codes. They are the genuine image passed through `cv2.GaussianBlur` with hand-chosen parameters. §1.7 has the detail.

### 1.2 Licence, language, size, dependencies

| | |
|---|---|
| **Licence** | **None.** There is no `LICENSE` file in the repository and the GitHub API reports `"license": null` **[primary]**. Under the Berne Convention that means all rights reserved — the code is publicly readable and **not** reusable. |
| Language | Python 3.7+ in a Jupyter notebook; all commentary and all markdown cells are in **Italian**, the README in English **[primary]** |
| Repository size | 192 MB, of which ~54 MB is two PDFs (a 38 MB copy of the source paper, a 15 MB course report) and 5.3 MB the notebook with its embedded outputs **[primary]** |
| Dependencies | Six lines in [`requirements.txt`](https://github.com/SickCiQuattro/WaterQRcode/blob/main/requirements.txt): `numpy`, `opencv-python`, `qrcode[pil]`, `pyzbar`, `matplotlib`, `Pillow`. No version pins **[primary]** |

The missing licence is the single most consequential fact in this section and it is not a formality: it makes the "could ODP reuse anything from it" question in §3.1 answerable in one word before any technical merit is considered.

### 1.3 Activity and maturity

| | |
|---|---|
| First commit | `9432ab5`, 2025-05-22, "Initial commit" |
| Last commit | `e9d3af2`, 2026-03-27, "Update README.md" — a README edit, not code |
| Last code commit | `5897d13`, 2025-11-28, "Generazione Finale" ("final generation") |
| Commits | 47 |
| Contributors | 2 — `SickCiQuattro` (31) and `scrapanzano` (16) |
| Issues | 0 open, 0 ever |
| Releases | 0 |
| Tests | none |
| CI | none — there is no `.github/` directory |
| Stars / forks / watchers | 1 / 0 / 1 |

All figures from `gh api repos/SickCiQuattro/WaterQRcode` and `git log` **[primary]**.

Read plainly: **the project was finished as coursework in November 2025 and has had one cosmetic commit since.** That is not a criticism — coursework is supposed to end — but it means there is no maintainer to collaborate with, no roadmap to align to, and no reason to expect a response to an issue.

### 1.4 Who is behind it

Two Master's students in Computer Engineering at the Università degli Studi di Brescia, named in the README as **Filippo Camossi** and **Davide Leone**, for a Digital Image Processing course **[primary]**. Commit authorship corroborates it: one account commits as `Filippino`, the other from `d.leone001@studenti.unibs.it`, a university student address **[primary]**. No funding, no company, no institutional affiliation beyond the course.

### 1.5 The technical core

The scheme is not the students' invention. It is an implementation of Wang, Zheng, You and Ju, *"A Texture-Hidden Anti-Counterfeiting QR Code and Authentication Method"*, [Sensors 2023, 23(2), 795](https://www.mdpi.com/1424-8220/23/2/795), Wuhan University. The paper is open access: *"© 2023 by the authors. Licensee MDPI, Basel, Switzerland… distributed under the terms and conditions of the Creative Commons Attribution (CC BY) license"* ([PMC mirror](https://pmc.ncbi.nlm.nih.gov/articles/PMC9863413/)) **[primary]**.

What is encoded, and where the security is supposed to come from:

1. **A stochastic halftone texture** is synthesised — Gaussian noise (μ=120, σ=100), low-pass filtered by bilinear down-then-up scaling, then binarised with a level-2 Bayer ordered-dither matrix.
2. **A QR code** (version 3, error correction H) is generated and its data modules are *shrunk* from 20×20 to 5×5 pixels, leaving the finder and alignment patterns intact.
3. **The two are fused**: the texture fills the background around the shrunken modules. The result still decodes with `pyzbar`, so an ordinary phone scanner reads it.
4. **Authentication (DFDA)** is a two-stage test on a captured image, computed in the frequency domain:
   - `MAF` — a sharpness gate, so a blurry photo is rejected rather than misread as a forgery.
   - `PR` (Pixel Ratio) — energy in four characteristic high-frequency regions of the DFT magnitude spectrum. **Reference-free.**
   - `NC` (Normalised Correlation) — cosine similarity between the DFT magnitude spectrum of the capture and that of **the original digital image**. **Requires the reference.**
   - A sample passes only if `NC ≥ NC_threshold` **and** `PR ≥ PR_threshold`.

The trust story, stated as the mechanism actually works: **nothing is signed and nothing is looked up.** There is no identifier, no key, no registry. The claim is purely physical — printing at high resolution, then scanning and reprinting, acts as a low-pass filter that destroys the texture's spectral signature, and the loss is measurable. This is the classic **copy detection pattern**, and it is orthogonal to everything ODP does.

Note the asymmetry between the two metrics, because it decides how such a thing would ever be deployed: `PR` needs only the captured image, while `NC` needs the issuer's original file. A `PR`-only deployment needs no registry at all; an `NC` deployment needs a trustworthy store of the reference image, which is where a registry — ODP's or anyone's — could in principle sit.

### 1.6 Threat model

**There is no threat-model document, and no section of the notebook states one.** What can be reconstructed from the code:

- **Claims to detect:** the print → scan → reprint → capture cycle, i.e. a counterfeiter photocopying a genuine label.
- **Explicitly out of scope, by the authors' own closing paragraph:** *"le prestazioni del sistema possono dipendere fortemente dalle condizioni di illuminazione durante la cattura dell'immagine e dalla qualità specifica della fotocamera utilizzata, fattori che in una simulazione sono approssimati"* — performance may depend heavily on lighting and camera quality, which a simulation only approximates **[primary]**.
- **Silently out of scope:** an attacker who obtains the *original digital file* and reprints it at the same resolution. The scheme detects the degradation of a **copy of a print**, not the printing of a copy of the file. Nothing in the notebook addresses this, and nothing can — it is a property of the scheme.

### 1.7 Where the README overstates what the code shows

Three things, in descending order of importance.

**The "forgery" is a blur, not a forgery.** `simulate_counterfeit_copy` applies an 11×11 Gaussian blur with σ = 4.2, downsamples to 30 % of resolution, quantises to ~12 levels and reprints. The config that drives it is commented, in the repository, `'scan_blur_kernel': (11, 11), # Kernel blur per scansione (contraffazione) - MOLTO AGGRESSIVO` and `'scan_blur_sigma': 4.2, # … MOLTO AGGRESSIVO per distruggere texture` — "VERY AGGRESSIVE, to destroy the texture" **[primary]**. The genuine path gets a 3×3 blur at σ ≈ 0.4. The classifier is therefore separating "blurred a lot" from "blurred a little", by construction. No physical print, scan or reprint appears anywhere in the repository.

**The thresholds are fitted on the same generator they are then evaluated against.** `tune_spectral_thresholds_joint` draws 50 genuine and 50 counterfeit samples from those two functions and grid-searches the `(NC, PR)` pair that maximises accuracy; `generate_spectral_features_dataset(…, num_genuine=100, num_counterfeit=100)` then produces the 200-sample "experimental verification" the README cites — from the identical generator **[primary]**. Train-on-test. Whatever accuracy Phase 6 reports is a property of the simulation's parameters, not evidence about paper and printers.

**The README's register does not match the artefact.** "Brilliantly combines the practical robustness of Level H QR error correction with advanced signal-based security" and "Research-to-Code Implementation" are the language of a portfolio page, not of a report whose own conclusions section concedes the simulation caveat. The Italian notebook is markedly more honest than the English README, which reads as though it was rewritten for an audience that would not open the notebook. Worth saying plainly, since the README is what a reader meets first.

To be fair to the students: the implementation itself looks careful. The DFT handling is correct, the log-scaling caveat before normalising `PR` is a real trap and they document it, the MAF gate exists precisely to avoid the obvious false-negative failure, and the parameters trace back to numbered equations in the source paper. As coursework it is good. As evidence about print-and-scan attacks it proves nothing, and the README does not say so.

---

## 2. OpenWaymark

<https://github.com/jagottsicher/OpenWaymark> · <https://openwaymark.org/>

### 2.1 What it actually is

A **working, tested implementation of a federated Certificate-Transparency-style provenance protocol in Go**, together with a nine-document normative specification. It is real: `go build ./...` succeeds, `go test ./...` passes in every one of 24 packages, and `go run ./demo` executes a full nine-stage end-to-end scenario against a live local node **[executed]**.

The README's claims are, unusually, *understated* rather than overstated. The one thing it does not say — that the whole thing is 10 days old — is in the git history for anyone who looks.

### 2.2 Licence, language, size, dependencies

| | |
|---|---|
| **Licence** | **Split, and deliberately so.** `LICENSE` is the full Apache License 2.0 text. [`REUSE.toml`](https://github.com/jagottsicher/OpenWaymark/blob/main/REUSE.toml) sets `SPDX-License-Identifier = "Apache-2.0"` for `path = "**"`, then overrides `node/**`, `monitor/**` and `internal/**` to `AGPL-3.0-only`, with the stated reason in a code comment: *"Server components are licensed under AGPL-3.0 so that operators give their changes back to the network they run them in."* `testdata/**` is pinned back to Apache-2.0 because *"Test vectors are part of the specification and are meant to be reusable by third-party implementations without conditions."* **[primary]** |
| Language | Go 1.25+, single module `openwaymark.org/owm`. 23 708 lines of Go, of which **11 674 are tests** — a near 1:1 test-to-code ratio **[primary]** |
| Specification | 4 508 lines of Markdown across nine `spec/owm-*.md` documents **[primary]** |
| Repository size | 828 KB **[primary]** |
| Dependencies | Five direct: `cloudflare/circl` (ML-DSA), `fxamacker/cbor/v2`, `santhosh-tekuri/jsonschema/v6`, `transparency-dev/merkle` (RFC 6962), `modernc.org/sqlite` (pure Go, no cgo). No web framework, no ORM, no Docker **[primary]** |

Apache-2.0 on the libraries and the spec is the licence you want on the other side of the table if you ever intend to borrow anything. AGPL on the servers is a boundary ODP would never need to cross.

### 2.3 Activity and maturity

| | |
|---|---|
| First commit | `6128c99`, **2026-08-10**, "Initial commit" |
| Last commit | `40ddb0b`, 2026-08-20, "Merge branch 'develop' into main for v0.7.0" |
| Commits | 128 on `main`, 132 across all branches |
| Commits per day | 1, 2, 1, 3, 10, **72**, 32, 11 — the 72 on 2026-08-18 |
| Contributors | 1 — Jens Schendel, under two author identities on the same email |
| Issues | 0 open, 0 ever |
| Tags | v0.1.0 … v0.7.0, eight of them; **no GitHub Release objects** |
| Tests | yes, everywhere, plus six fuzz targets over the parsers |
| CI | yes, [`.github/workflows/ci.yml`](https://github.com/jagottsicher/OpenWaymark/blob/main/.github/workflows/ci.yml) — build, gofmt, vet, staticcheck, `go test -race`, fuzz smoke. **Every run on record is green** (`gh api …/actions/runs`) |

All from `git log`, `git shortlog -sne` and the GitHub API **[primary]**.

Verified locally: `go test ./...` — 24 packages, all `ok`; statement coverage as CI's own command reports it, **52.1 %** **[executed]**.

Two honest observations about the cadence. First, **the whole project is ten days old** — eleven tags in ten days, and "the format is not yet stable" is the README's own first status line. Second, the history shows a `CLAUDE.md` that was tracked, then purged from history with `git filter-repo` across all branches and guarded against by a dedicated CI job **[primary]**. This is an AI-assisted single-author project moving at AI-assisted single-author speed — **exactly the working mode ODP itself declares in its README**, so the observation is a note about sustainability risk, not a mark against the code. The code is real, the tests are real, and the demo does what it says. What is unproven is whether anyone else will ever run a node.

### 2.4 Who is behind it

One person: **Jens Schendel** (`jagottsicher`), GitHub account since 2017, 92 public repositories, 22 followers, located in Shanghai, self-described in his bio as holding C, LPIC-2 and "Certified Blockchain Solution Architect" credentials **[primary]**. The project website confirms that **only one organisation currently runs an OpenWaymark node: the project itself**, and names no funder, company or institution; it mentions the NGI Zero Commons Fund only as the kind of funding that exists for such work, not as funding received **[primary]**. GitHub reports no funding links **[primary]**.

The README states GitLab (self-hosted at `gitlab.jens-schendel.com`) is the source of truth and the only place that deploys; GitHub carries a mirror with a reduced CI. That self-hosted instance was not checked **[unverified]**.

### 2.5 The technical core

The problem: prove *who said what about which good, when*, across companies that do not trust each other, without a blockchain and without a central authority, while still being able to delete personal data.

The mechanism, in the order the bytes flow:

1. **Entry.** A signed statement: subject, issuer, profile, parent entries, and — instead of the payload — a commitment to it. Serialised as deterministic CBOR (RFC 8949 §4.2), content-addressed by `EntryID = H("OWM/1 entry-id", canonical_cbor(Entry))`.
2. **Commitment.** `Salt = 32 random bytes`; `Commitment = HMAC-SHA-256(key = Salt, msg = u8(len(label)) ‖ label ‖ payload)` with `label = "OWM/1 commit"` ([OWM-0 §5](https://github.com/jagottsicher/OpenWaymark/blob/main/spec/owm-0-overview.md)). The payload never enters the log.
3. **Leaf and tree.** Appended to a per-node Merkle log built on `transparency-dev/merkle`'s `rfc6962.DefaultHasher` — *"SHA-256 with 0x00 in front of leaves and 0x01 in front of interior nodes"* (`log/leaf.go`) **[primary]**.
4. **Signed Tree Head.** Log ID, tree size, root hash, timestamp, signed. Inclusion and consistency proofs follow, and the client recomputes both.
5. **Erasure.** Deleting payload *and salt* and appending a tombstone. The tree is untouched, so every proof ever issued stays valid — and without the salt the payload cannot be brute-forced back even from a tiny value range. Demonstrated live: *"200000 guesses with the plaintext known: no hit"* **[executed]**.
6. **Federation.** DNS discovery (`_openwaymark.example.com IN TXT "v=owm1; node=…"`), partner gossip, and independent monitors polling `GET /owm/v1/sth`.
7. **Crypto.** ML-DSA-65 for entities and nodes, ML-DSA-44 for sensors, ML-KEM-768 + AES-256-GCM for optional payload confidentiality, SHA-256 with per-context domain separation. **No ECC anywhere** — which is the single fact that most cleanly separates it from ODP.
8. **Profiles.** Eleven industry JSON-Schema profiles (`food`, `pharma`, `meddevice`, `aviation`, `vehicle`, `electronics`, `minerals`, `seafood`, `eudr`, `diamonds`, `eu/battery`), each versioned immutably — *"Changes to `food.v1` are not changes but `food.v2`."*

What is trusted: the issuer's key for attribution, nothing else. The client recomputes every identifier, signature, commitment and proof itself, and [OWM-8](https://github.com/jagottsicher/OpenWaymark/blob/main/spec/owm-8-client.md) makes that a contract: *"a client that trusts an answer without computing for itself has given away the entire point."*

The demo makes all of this observable, including the failure paths: a temperature sensor's readings contradicting the freight papers ("2 of 7 readings outside the promised range"), an erasure returning HTTP 410 while its earlier proof still verifies, a flipped byte invalidating a signature, and a split view detected across two STHs of the same tree size **[executed]**.

### 2.6 Threat model

[OWM-9](https://github.com/jagottsicher/OpenWaymark/blob/main/spec/owm-9-threat-model.md) — 487 lines, five attacker classes, fifteen enumerated attacks with a coverage verdict each. It is better than most commercial equivalents and it is unusually willing to say "no".

The governing sentence: *"OpenWaymark does not prove that a statement is true. It proves who made it and when, and that it has not been altered since."*

Explicit non-goals, quoted from §3: truth of the first capture; global consistency; censorship resistance against one's own node operator; **protection against physical substitution**; anonymity of participants.

Two entries matter directly to ODP:

- **A8 — physical substitution or cloning: "Not covered — the binding between the bit and the thing is physical, not cryptographic."** The mitigation offered is honesty rather than a mechanism: display a binding level so that *"a printed QR code on an otherwise unbroken chain must not look like a proof."*
- **A9 — linking through metadata: "Only partly covered."** Timestamps, frequency and issuer IDs remain visible even when payloads are encrypted, from which *"delivery volumes, customer relationships and plant utilisation can be estimated"*. The residual risk is carried, not mitigated: *"a log that is meant to be checkable must be observable."*

That second one is the same finding ODP reached independently and wrote into [`SPEC.md` §20.14(7)](../../SPEC.md#2014-stated-limits-normative-honesty-rules). Two projects arriving at the same irreducible trade-off by different routes is a mild confirmation that it really is irreducible.

---

## 3. Fit against ODP

### 3.1 WaterQRcode

**Overlap, complement, or neither: complement in principle, nothing in practice.**

It touches exactly one place in the specification, and it is a place ODP has already fenced off. [`SPEC.md` §6](../../SPEC.md#6-physical-seal), *Informative — other NFC / tag technologies*, says QR-only labels *"are **not** drop-in replacements for **Level 2A** NFC crypto verification unless a future SPEC defines a binding with a normative verify recipe."* A copy-detection pattern is a candidate for exactly such a recipe: it would be a physical binding of the same class as §6's seals, and it would sit as an anchor in [§9](../../SPEC.md#9-passport-json), most plausibly under the existing `fingerprint` bit (1024) or a new reserved bit, with a `Level 2E` in [§11](../../SPEC.md#11-verification-algorithm) and a tier decision in the §11 assurance-tier table.

**Could ODP reuse anything from it: no, and the licence settles it before the merit does.** There is no `LICENSE` file, so the notebook is all-rights-reserved and cannot be copied, adapted or vendored regardless of how useful it might be. What *is* reusable is the underlying paper — Wang et al. 2023 is CC BY 4.0, so its equations, its `MAF`/`NC`/`PR` definitions and its figures may be implemented and quoted with attribution by anyone. **If ODP ever wants copy-detection patterns, it should read the paper and skip the repository.**

Even setting the licence aside, there is a structural mismatch that would not go away: **ODP anchors exact hashes, and a copy-detection pattern is a thresholded correlation.** `NC ≥ 0.88` is not `sha256(x) == y`. ODP has already ruled on this class of evidence once — [§9](../../SPEC.md#9-passport-json) marks `perceptual_hash` (bit 64) **"supplementary only"** for precisely this reason — and a CDP anchor would have to land in the same category. It would carry a *method reference and a reference-image hash*, not a verdict.

**Could it use ODP: yes, and this is the only genuinely interesting direction.** The `NC` half of DFDA needs a trustworthy copy of the issuer's original digital image. ODP already stores `imageHash` on-chain and verifies it at [Level 3](../../SPEC.md#11-verification-algorithm). A CDP scheme that published its reference texture under a passport would get, for free, the one thing the paper does not address: proof that the reference image itself has not been swapped. That is a real complement — but it needs someone to build the verifier, and the two students are not that someone.

**Integration cost: high, and paid entirely by ODP.** A normative `Level 2E` means specifying the capture conditions (resolution, lighting, camera class), the metrics, the thresholds, and — worst — the *false-positive behaviour*, because a genuine object photographed badly must not read as counterfeit. §11's honesty rules would then require stating a false-reject rate that nobody has measured on real paper. The notebook cannot supply those numbers: its 200-sample evaluation is synthetic and fitted on itself (§1.7). ODP would be starting from zero with a print run, a set of phones and a measurement campaign.

**Verdict: ignore the repository, keep the paper.** It is finished coursework with no licence, no tests, no maintainer and a synthetic evaluation, and the technique it implements is available directly from a CC BY source that ODP can cite without permission.

### 3.2 OpenWaymark

**Overlap, complement, or neither: mostly complement, with one narrow and unimportant overlap.**

The two projects are answering different questions about the same objects. ODP asks *"is this thing the thing its passport describes?"* — one issuer, one object, identification anchors, physical seals, verification by a member of the public with a phone and no account. OpenWaymark asks *"which stations did this lot pass through and who signed for each?"* — many issuers, many events, a federation of servers, verification by a counterparty or an auditor. ODP's [§9 provenance rule](../../SPEC.md#9-passport-json) — *"Protocol-level provenance starts at mint"* — is precisely the boundary at which OpenWaymark's problem begins.

The overlap is at the edges: both have append-only event histories (ODP's `recordPassportEvent`, OpenWaymark's log), both have an institutional-attestation notion (ODP's `P`/`M` `submitProof`, OpenWaymark's `attestation` entries and trust levels), and both refuse to adjudicate truth. Neither overlap is worth resolving; they are two implementations of the same honest posture at different scopes.

Three facts make a merge structurally impossible, and they should be stated so nobody spends a week discovering them:

1. **ODP is on a public blockchain by design; OpenWaymark is anti-blockchain by design.** Its README's own framing: *"Comparable to email or DNS, not to a blockchain."* ODP's entire durability claim — verification still works in 250 years because no server is involved — is the claim OpenWaymark replaces with federation plus gossip.
2. **Different cryptography, not compatible.** OpenWaymark is ML-DSA/ML-KEM only, *"No RSA, no ECC, no hybrid transition scheme"*. ODP is secp256k1 and EIP-191 throughout, because it lives on Polygon. Nothing signed in one system verifies in the other.
3. **Different erasure postures.** OpenWaymark treats GDPR erasure as a core requirement and keeps every payload off-log behind a salted commitment. ODP writes the card (`title`, `authorName`, `shortDescription`, `domain`) on-chain in the clear, immutably and deliberately, and [`docs/SECURITY.md`](../SECURITY.md) says so: *"Event payloads are public forever."* These are opposite answers to the same question, each correct for its own use case.

**Could ODP reuse anything from it — three concrete candidates, in descending order of value.**

1. **The commitment construction, as a critique of ODP's own.** OpenWaymark's [OWM-0 §5](https://github.com/jagottsicher/OpenWaymark/blob/main/spec/owm-0-overview.md) uses `HMAC-SHA-256(key = salt, msg = length-prefixed label ‖ payload)`. ODP's blind-box commitment in [`SPEC.md` §20.4](../../SPEC.md#204-the-unit_variant_commit-anchor-optional) is `SHA-256(uint32be(i) ‖ utf8(variant_i) ‖ salt_i)` with `salt_i` specified only as *"at least 128 bits"* — **variable length, concatenated without a length prefix.** That is an ambiguity: `(variant = "A", salt = X‖Y)` and `(variant = "A"‖X, salt = Y)` produce the same preimage. It is unlikely to be exploitable in a blind-box setting where the variant vocabulary is a dozen fixed strings, but it is free to fix and OpenWaymark's construction shows how — pin the salt to exactly 32 bytes, or length-prefix the fields. **This is the single most useful thing in the repository for ODP.** The idea itself is not copyrightable; no licence question arises.
2. **RFC 6962 tree construction, as a comparison.** [`SPEC.md` §20.3](../../SPEC.md#203-the-unit_key_set-anchor) specifies a Merkle tree with *"interior node = SHA-256(left ‖ right)"* and *"when a level has an odd number of nodes, the last node is duplicated"* — the Bitcoin-style construction, with no leaf/interior domain separation. OpenWaymark uses RFC 6962's `0x00`/`0x01` prefixes and gets inclusion and consistency proof verifiers off the shelf. My assessment — stated as analysis, not proof **[unverified]** — is that ODP's construction is *not* vulnerable to the classic duplicate-node ambiguity, because the index is inside every leaf (so a duplicated leaf carries a duplicate index rather than creating a new unit), `unitCount` is committed in the same anchor, and leaf preimages are a fixed 24 bytes against interior preimages of 64, which provides de-facto domain separation. **The conclusion is therefore "leave §20.3 alone" — but the reasoning above belongs written down in §20.3, because the next reviewer will notice the missing prefixes and ask.** Changing the construction now would be a normative break for no security gain.
3. **The binding-level vocabulary, as a cross-check on ODP's tiers.** [OWM-6 §5](https://github.com/jagottsicher/OpenWaymark/blob/main/spec/owm-6-trust.md) defines four physical-digital binding levels — printed static QR (*"easily copied"*), single-use serial scan-locked after redemption (*"race-condition-prone"*), NFC challenge-response (*"practically unclonable"*), PUF + chip signature (*"physically unclonable"*) — and pairs them with a **minimum principle**: a chain's level is the *lowest* of every participant and binding involved. ODP's Base / Sealed / Attested tiers are additive rather than minimising. The comparison is worth one paragraph of thought, not a change: ODP's §20.12 already refuses to let `unit_key_set` raise a tier, which is the same instinct. Note that OWM-6 concedes it *"does not define a wire mechanism"* for binding levels and *"No profile does yet"* — so on this specific axis **ODP §6 and §20 are ahead of OpenWaymark, not behind it.**

Licence terms for all three: `spec/`, `core/`, `log/`, `testdata/` are Apache-2.0. Apache-2.0 source **cannot** simply be relicensed into ODP's MIT tree — any copied file would have to keep its Apache header, its attribution, and a `NOTICE` if one applies. Ideas, constructions and specification prose read for inspiration carry no such obligation. Since all three candidates above are ideas rather than code, **nothing here creates a licensing problem** unless someone vendors Go source, which ODP has no reason to do.

**Could it use ODP: yes, and this is the sharper direction.** OpenWaymark's A8 is an admitted hole — *"the binding between the bit and the thing is physical, not cryptographic"* — and its binding-level table is a vocabulary with no mechanism behind it. ODP §6 (NTAG 424 DNA EV2 challenge-response) and §20 (per-unit keys under a tamper-evident layer, public activation) are exactly a mechanism for that table's "High" and "Medium" rows, already specified in normative detail. An OpenWaymark profile could reference an ODP passport ID as the physical-binding evidence for a subject, the way `food.v1` references EPCIS event types. That costs ODP **nothing**: it is a citation in someone else's spec, not a change to ours.

**Integration cost, being pessimistic.** Anything beyond citation is expensive and should be refused:

- *A cross-verification path* (an ODP verifier that reads an OpenWaymark chain, or vice versa) needs a new normative SPEC section, a second signature scheme in the verifier, a resolution rule for OpenWaymark's `LogID` → URL — which [OWM-8 §5](https://github.com/jagottsicher/OpenWaymark/blob/main/spec/owm-8-client.md) admits *"there is no protocol-level mechanism"* for — and a trust story for a federation of servers, which is the exact dependency ODP exists to avoid. **This would break ODP's central promise and should not be attempted.**
- *Adopting the profile mechanism* (JSON Schema per industry) into ODP's anchors would be a large §9 rewrite for a problem ODP does not have: ODP's `anchors[]` registry is fifteen fixed types plus reserved bits, and its users are artists and small brands, not pharmaceutical distributors.
- *The salt fix in §20.4* is the only item that is genuinely cheap — one sentence, in an unreleased line, before anything is printed.

**Verdict: watch closely, borrow one construction, and reach out.** It is the most serious adjacent project ODP has encountered — a real specification with real tests and an unusually honest threat model — it is complementary rather than competitive, and its author is another solo AI-assisted builder working on the same trust problem from the opposite end. There is a specification to critique on both sides and nothing to fight over.

### 3.3 One thing worth noticing about both

Neither project has ever been used on a physical production run. WaterQRcode's forgeries are `cv2.GaussianBlur`; OpenWaymark's supply chain is a demo with fictional German dairies; ODP §20 has never labelled a real box. All three are specifications and reference code arguing about a physical world none of them has touched yet. That is not a reason to stop — it is a reason to be careful about which of them claims otherwise, and only one of the three does (§1.7).

---

## 4. What I would do

Ranked. Each is one action and one reason.

1. **Fix the `salt_i` ambiguity in [`SPEC.md` §20.4](../../SPEC.md#204-the-unit_variant_commit-anchor-optional): pin the salt to exactly 32 bytes, or length-prefix the commitment's fields.** Variable-length concatenation makes `(variant, salt)` pairs ambiguous; OpenWaymark's HMAC construction ([OWM-0 §5](https://github.com/jagottsicher/OpenWaymark/blob/main/spec/owm-0-overview.md)) is the standard fix, the v0.7 line is unreleased, and no label has been printed yet — so this costs one sentence today and a re-print later.

2. **Add two sentences to [`SPEC.md` §20.3](../../SPEC.md#203-the-unit_key_set-anchor) explaining why the duplicate-last-node tree is safe here.** The construction omits RFC 6962's leaf/interior domain separation and every reviewer who knows CVE-2012-2459 will flag it; the answers — index inside the leaf, `unitCount` committed, fixed-length leaf preimages — already exist and just are not written down. Do **not** change the construction.

3. **Open an issue on OpenWaymark offering ODP §6 and §20 as the missing mechanism for [OWM-6 §5](https://github.com/jagottsicher/OpenWaymark/blob/main/spec/owm-6-trust.md)'s binding levels.** That table has four levels and, by its own admission, no wire mechanism and no profile implementing it; ODP has a normative one for two of the rows. It is a citation in their spec, costs ODP nothing, and starts a conversation with the only comparable project found so far.

4. **Do nothing about WaterQRcode.** No licence, no maintainer, no tests, a synthetic evaluation fitted on itself — and the technique is available directly from [Wang et al. 2023](https://www.mdpi.com/1424-8220/23/2/795) under CC BY. If copy-detection patterns become interesting for ODP, start from the paper, not the repository.

5. **Do not attempt any ODP ↔ OpenWaymark cross-verification path.** It requires a second signature scheme, a `LogID`-to-URL resolution mechanism that [OWM-8 §5](https://github.com/jagottsicher/OpenWaymark/blob/main/spec/owm-8-client.md) says does not exist, and a dependency on a federation of live servers — which is the exact thing ODP's registry-on-a-public-chain design exists to avoid.

---

*Sources are inline and are the repositories themselves. Where a claim rests on running the code, it is marked **[executed]**; where it is my own analysis rather than a citable fact, it is marked **[unverified]** in place. The self-hosted GitLab instance named as OpenWaymark's source of truth was not checked, and the two large PDFs in WaterQRcode were not read beyond their identification.*
