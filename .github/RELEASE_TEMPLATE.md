# How to write an ODP release note

Every GitHub Release body is a file in [`docs/releases/`](../docs/releases/), copied verbatim.
The file is the source of truth; the release page is a copy of it. That way the two can never
drift apart, and the note can be reviewed in a pull request like anything else.

There are two layers, and nothing lives in both:

| | Release note | Changelog entry |
|---|---|---|
| **Reader** | someone who just arrived | someone who needs every detail |
| **Length** | under ~35 lines | as long as it takes |
| **Jargon** | glossed or absent | fine |
| **Home** | `docs/releases/vX.Y.md` | [`CHANGELOG.md`](../CHANGELOG.md) |

The release note never repeats the changelog. It links to it.

**The changelog is the source.** Keep a Changelog 2.0.0 covers this directly — *"A changelog is
the complete, ongoing record… Release notes are an announcement for a single release"*, and
*"the changelog is the source; release notes are drawn from it and shaped for the
announcement."* So write the changelog entry first, then write the note from it. If the two
disagree about a fact, the changelog is right and the note is wrong.

**One deliberate deviation.** 2.0.0 suggests copying the version's changelog section into the
release and expanding it. We do not: our changelog is written for someone who wants every
detail and uses the vocabulary that comes with it, and copying that across would produce exactly
the wall of jargon these notes exist to avoid. The note is written fresh, from the same facts.

Both layers live in this repository rather than only in GitHub's database — which is the risk
2.0.0 warns about: *"everything is stored in the host's database, not your repository… your
changelog goes where your code goes."*

---

## The skeleton

Sections in this order. Do not rename them, do not reorder them, do not drop one because it
felt empty — an empty-looking section usually means the answer is "no", and the reader still
needs to be told "no".

The header block is **fixed line for line** — copy it from an existing note rather than
retyping it. Line 3 is one source line however long it runs; wrapping it in one file and not
another produces a diff that looks like an edit and is not one. Both links on line 5 are the
canonical ones, and when the site moves they move in all eight notes together.

**The standfirst is optional, and its shape is not.** If a note needs a sentence before the
sections — this version was never released, this one is a pre-release, this one went live on a
date — it goes directly after the "New here?" line, as **one paragraph**, and **opens with a
bold clause**. That bold opening is what makes it read as a standfirst rather than stray body
text. A note that skips it looks like a different document to anyone scanning the list, which
is exactly the complaint that produced this rule.

**Headings are `##` and nothing else.** Never `###`, never bold-as-a-heading. One `#` for the
title, five `##` for the sections, and no other heading anywhere in the note.

```markdown
# ODP vX.Y — <plain-language subtitle, six words at most>

ODP is a free, open digital passport for real objects — art, limited runs, archives — that anyone can verify. Forever.

**New here?** [What this is](https://…) · [Verify something — free, no wallet](https://…)

**Optional standfirst.** One paragraph, bold opening clause, or leave it out entirely.

## What changed

Three to five bullets. Plain claim first, technical name in brackets after — never the
reverse. "Objects now carry a short description you can read without downloading anything
(the on-chain card)" — not "adds the on-chain card (`title`, `authorName`, …)".

## Do I need to do anything?

Answered for three readers, explicitly, even when the answer is no:

- **You already registered a passport** — …
- **You are about to register one** — …
- **You run your own copy** — …

## Where it lives

The registry address, and one link to the full list. Not the full list.

## Full detail

One link to this version's section of the changelog.

## Status

One line: what stage the project is at, and what that risks for the reader.
```

## The rules

**1. Gloss it or lose it.** A word that is not everyday English gets a short plain-English
explanation the first time it appears in that body, or it does not appear at all. "Satellite"
costs five words to explain — spend them. If a term needs a paragraph, it belongs in the
changelog and the release note should describe the effect instead.

**2. These never appear in a release note.** They are changelog vocabulary:

```
EIP-170   EIP-712   bitmask   domain separator   packed CONTRACT_VERSION
error codes such as EC(68)    ABI method names    repo file paths used as prose
```

Describing what something *does* is always available: "the contract stayed under the size
limit the network enforces" says the useful half of EIP-170 without the label.

**3. No bare specification references.** `SPEC §12.3` means nothing to a first-time reader.
Link to the section, or say the rule in words.

**4. Links are absolute `https://` URLs.** Relative links work in the repo and break on the
release page the moment a directory moves — which is exactly what happened to the v0.3 and
v0.4 notes when `deploy/` became `chain/deploy/`.

**5. "Do I need to do anything?" is never omitted.** In this project each version is a separate
registry and passports do not migrate between them. That is the reader's real question, and it
must be answered before they have to ask it.

**6. Say the uncomfortable thing.** A version that was deployed and never released, a safety
mechanism that is missing from one line, a check that does less than its name suggests — put it
in the note, in plain words. A reader who finds it later finds it as a discovery instead of a
disclosure.

## Checking a note before publishing

```bash
node chain/tools/lint_release_notes.mjs      # headings, banned terms, relative links
```

The script catches what it can spell. The real test is reading the note as someone who has
never heard of a blockchain and asking, of every sentence, whether it lands or sends them
somewhere that explains it.

## Publishing

```bash
gh release create vX.Y --title "ODP vX.Y" --notes-file docs/releases/vX.Y.md
gh release edit   vX.Y --notes-file docs/releases/vX.Y.md   # for an existing release
```
