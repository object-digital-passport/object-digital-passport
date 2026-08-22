# Branch protection

Two rulesets live in [`rulesets/`](rulesets/) next to this file, as JSON that GitHub imports
directly. They are committed rather than kept on one machine: a rule about how `main` may be
changed is part of how the repository is built, and reviewing a diff of it beats remembering what
was clicked.

> Applying one is a deliberate act — nothing here configures GitHub on its own.

| File | What it does |
|---|---|
| [`main-default-branch.json`](rulesets/main-default-branch.json) | **Start here.** Changes to `main` go through a pull request; CI must pass; review threads must be resolved; the branch cannot be deleted or force-pushed. Repository admins can bypass, so a solo owner is never locked out. |
| [`main-default-branch-strict.json`](rulesets/main-default-branch-strict.json) | The same, plus one required approval, stale approvals dismissed on push, and **no bypass for anyone** — including the owner. Meant for when there are other maintainers. |

Both target `~DEFAULT_BRANCH` rather than the literal name `main`, so renaming the default branch
does not silently un-protect it.

## Apply one

**Settings → Rules → Rulesets → New ruleset → Import a ruleset**, then upload the JSON.

Or through the API:

```bash
gh api --method POST /repos/object-digital-passport/object-digital-passport/rulesets \
  --input .github/rulesets/main-default-branch.json
```

To change one afterwards, edit the JSON here, then `PUT` it to
`/repos/{owner}/{repo}/rulesets/{id}` — `gh api /repos/{owner}/{repo}/rulesets` lists the ids.
Editing in the web UI instead leaves this file lying, which is the failure mode committing it was
meant to prevent.

## Required status checks

The non-strict ruleset requires these five, named exactly as the jobs in
[`ci.yml`](workflows/ci.yml) name themselves:

`Hardhat tests` · `passport.json schema validation` · `release note style` ·
`Slither static analysis` · `organization profile links`

**Renaming a CI job silently un-requires it** — a required check that never reports is treated as
not applicable, not as failing. Rename a job, and this list needs the same edit in the same commit.

CodeQL is deliberately not in the list. It runs on pull requests and weekly on a schedule, but
requiring it would block merges on an analysis whose runtime is unrelated to whether the change is
correct.

## Tags

Release tags (`v0.6`, `v0.7`, …) are immutable by policy, not by enforcement — see
[`docs/VERSIONING_AND_RELEASES.md`](../docs/VERSIONING_AND_RELEASES.md). A tag ruleset can enforce
it: target `refs/tags/v*`, rule `deletion` plus `non_fast_forward`. Worth adding once a tag has
ever been moved by accident.

## The local scratch directory

`/rulesets/` at the **repository root** stays git-ignored, for templates pulled from elsewhere
(e.g. [`github/ruleset-recipes`](https://github.com/github/ruleset-recipes)) that are not meant to
become part of this repository. The committed ones are the two in `.github/rulesets/`.
