# Branch protection (GitHub) — optional checklist

**Status:** documentation only. Nothing here runs automatically. Enable a **ruleset** or **branch protection** in the repo **Settings** when you want stricter workflow (e.g. after v0.1 is tagged and you want PR-only `main`). Until then, skip this file.

**Ready-to-import rulesets (local only, not in git):** use a **`rulesets/`** directory in the **repository root** (same level as `package.json`). The path **`rulesets/`** is in **`.gitignore`**, so JSON templates and `README.md` there stay on your machine and are **not committed or pushed**. Populate that folder yourself (or copy from a teammate / [`github/ruleset-recipes`](https://github.com/github/ruleset-recipes)). Official docs: [About rulesets](https://docs.github.com/ru/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).

---

Use this if you want **`main`** to accept changes **only via pull requests** (and optionally to block **direct pushes even for administrators**).

> Paths on GitHub: **Settings → Rules → Rulesets** (recommended) or **Settings → Branches → Branch protection rules** (classic).

## Recommended ruleset for `main`

1. **Target:** Branch name `main` (or pattern `main`), or import `main-default-branch.json` which uses `~DEFAULT_BRANCH`.
2. **Require a pull request before merging**  
   - Optional: require approvals (e.g. 1) — useful when there are collaborators; solo dev can use **0** approvals but still use PRs for discipline (`main-default-branch.json` uses **0**; `main-default-branch-strict.json` uses **1**).
3. **Restrict deletions** — prevent accidental branch deletion.
4. **Block force pushes** — keep history on `main` predictable.

## If you want *no* direct pushes even as repo owner

- In the ruleset / branch protection, enable restrictions so that **administrators are also subject to the rules** (wording varies: e.g. **“Do not allow bypassing the above settings”** / **“Allow force pushes”** disabled / **“Allow specified actors to bypass”** empty).
- Then **you also** merge only via PR. You can still **change the rule later** in **Settings** if you are the only owner — so this is **discipline + friction**, not cryptographic enforcement.

## Tags (`v0.1`, etc.)

- **Tag protection** (GitHub Enterprise / some org features) can limit who creates or updates tags. On free personal repos, rely on **policy**: do not delete or move release tags.
- After publishing **v0.1**, document in [`docs/VERSIONING_AND_RELEASES.md`](../docs/VERSIONING_AND_RELEASES.md) that the tag is **immutable**.

## GitHub Actions (if used)

- If you add required status checks, add them in the ruleset under **Require status checks to pass**.

---

*This file is documentation only; it does not configure GitHub by itself.*
