# Reference passport UI & standard — community input (toward v0.4)

ODP is an open protocol: beyond the on-chain registry and `passport.json`, it matters how a **passport is presented** to people — and how that lines up with the **specification**.

This repository ships a **reference static HTML** implementation (`web/frontend/`, including passport and verification screens). It is **not** meant to be the one true visual standard; it is a **working example** of which blocks appear, in what order, and how spec fields surface in the UI.

**We would like your input:**

- Is this layout readable and trustworthy for end users?
- Would you use this HTML/CSS as a **baseline** for your own integrations and branded surfaces, or do you need separate **presentation guidelines** (components, non-normative “passport sheet” patterns)?
- What would you change in **information hierarchy** (what belongs above the fold, what should fold behind details)?

Your answers will help us decide what to publish in **v0.4** as **recommended presentation guidance** alongside `SPEC.md`, versus what stays only in the reference implementation.

**Pointers:** [SPEC.md](https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md) — normative data model; [web/frontend/localization/ru/SPEC.md](https://github.com/object-digital-passport/object-digital-passport/blob/main/web/frontend/localization/ru/SPEC.md) — Russian draft; [web/](https://github.com/object-digital-passport/object-digital-passport/tree/main/web) — reference UI pages.

---

*Maintainers: run `bash scripts/gh-create-discussion-from-doc.sh` after `gh auth login`, or paste this file into **Discussions → New** (category **Ideas** or **General**).*
