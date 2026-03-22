# Branch protection (GitHub) — optional checklist

**Status:** documentation only. Nothing here runs automatically. Enable a **ruleset** or **branch protection** in the repo **Settings** when you want stricter workflow (e.g. after v0.1 is tagged and you want PR-only `main`). Until then, skip this file.

---

Use this if you want **`main`** to accept changes **only via pull requests** (and optionally to block **direct pushes even for administrators**).

> Paths on GitHub: **Settings → Rules → Rulesets** (recommended) or **Settings → Branches → Branch protection rules** (classic).

## Recommended ruleset for `main`

1. **Target:** Branch name `main` (or pattern `main`).
2. **Require a pull request before merging**  
   - Optional: require approvals (e.g. 1) — useful when there are collaborators; solo dev can use **0** approvals but still use PRs for discipline.
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
