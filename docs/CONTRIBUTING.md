# Contributing

Thanks for looking. A first contribution does not have to be big.

**This repository is the standard** — `SPEC.md`, the contracts, the schema, the vectors. The reference website is [a separate repository](https://github.com/object-digital-passport/object-digital-passport.github.io) with its own issues. A useful test: if a different implementation would have to change too, it belongs here; if the website could fix it alone and stay conformant, it belongs there.

## Find something to do

- [**`good first issue`**](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — small, prepared, with a stated done-condition. Start here.
- [**`help wanted`**](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) — we want help; **not necessarily easy**.
- **`ready to work`** — scope settled, no open design question.
- **`mentor available`** — a maintainer will answer questions in the issue.
- **`needs info`** — not ready. Do not pick it up.

**You do not need permission to start.** A short "taking this" comment only helps avoid two people doing the same work. If you stop, say so — that is normal and nobody minds.

## Run what you need

### Documentation is translated into Russian, and CI enforces it

Every document in this repository has a Russian version under [`docs/ru/`](ru/), or a written
reason why it does not. The record is [`docs/TRANSLATIONS.md`](TRANSLATIONS.md), and
`tools/check-translations.mjs` reads it as its own CI job.

Three rules follow from that:

1. **English is normative.** Where a translation disagrees with the English text, the translation
   is the bug. Every Russian file says so at its top.
2. **Adding an English document means adding a row.** CI fails on a document that no row accounts
   for — the row is where you decide whether it gets translated, is planned, or deliberately does
   not. The same applies to a new file under `docs/ru/`.
3. **Changing an English document means checking its translation.** The job reports identifiers
   present in the English and missing from the Russian — addresses, `v0.N` strings, field and
   status-code names. That report is not fatal yet, because it describes a backlog older than the
   check; do not add to it.

Names that a machine reads are never translated: `dataHash`, `anchorsHash`, `passportId`,
`unitKey`, `anchorTypesMask`, `.odpass`, and the `ODP-…` / `C-…` / `B-…` / `P-…` / `M-…` formats.
A translated identifier is a file that stops validating.

Translations into **other** languages are welcome and are tracked separately — see the open issues.

## Where to start
Most documentation tasks need nothing installed. For the rest:

```sh
git clone https://github.com/object-digital-passport/specifications.git
cd specifications

cd chain && npm install && npm test   # 103 Hardhat tests
node tools/check-profile-links.mjs    # links in the organization profile
node chain/tools/lint_release_notes.mjs
```

## Before a pull request

- The change matches the **Done when** list in the issue.
- The checks above pass.
- The pull request contains only what the issue asked for — no drive-by reformatting.
- The description says `Fixes #123`.

`main` takes pull requests only, and CI must be green. Details in [`.github/BRANCH_PROTECTION.md`](../.github/BRANCH_PROTECTION.md).

## Language

**Issues, pull requests and Discussions are in English**, so everyone follows the same thread. Not a judgement about anyone's language — a rule about where the conversation happens.

**`SPEC.md` in English is the only normative text.** Everything under `docs/ru/` and every other translation is informational: where a translation disagrees with the specification, the translation is the bug.

## Where the code lives

| | |
|---|---|
| `SPEC.md` | The standard. Breaking changes need discussion first |
| `chain/contracts/` | Solidity. Many fixes need a **new deployment**, not a patch — say so in the pull request |
| `schema/` | JSON Schema, examples, known-answer vectors |
| `chain/tools/`, `tools/` | Node ESM tooling |
| `docs/`, `docs/ru/` | Everything else, and its Russian translation |

Never commit a private key. `chain/deploy/` is where that mistake would happen.

## Stuck?

**Ask in the issue you are working on.** It is expected, and especially fine when:

- you cannot find the code the issue refers to;
- a check will not run;
- the **Done when** list can be read more than one way — that means it is written badly and we want to know.

## Review

Review comments are a normal part of contributing, not a verdict. A maintainer will try to say why, not only what.

## Other things

- Questions and design arguments → [Discussions](https://github.com/object-digital-passport/specifications/discussions)
- Security → [`SECURITY.md`](SECURITY.md). Never a public issue for anything exploitable
- Conduct → [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
- How versions and tags work → [`VERSIONING_AND_RELEASES.md`](VERSIONING_AND_RELEASES.md)
