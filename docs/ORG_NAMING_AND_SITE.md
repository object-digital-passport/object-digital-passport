# Repository names and the site address

A proposal, not a change. Nothing here has been applied. It exists because the names the
organization grew into describe how the code was written rather than what each piece is, and
because the published address is longer than the thing it names.

---

## 1. What the names look like now

| Repository | Reads as |
|---|---|
| `object-digital-passport/object-digital-passport` | the organization, said twice |
| `object-digital-passport/object-digital-passport.github.io` | the organization, said twice, plus a hosting detail |
| `object-digital-passport/odp-apple-app` | an abbreviation the organization does not otherwise use, plus "apple app" |
| `object-digital-passport/odp-android-companion` | the same abbreviation, plus a word — "companion" — that names a relationship, not a thing |
| `object-digital-passport/demo-repository` | GitHub's sample repository, still present |

Two habits are mixed. `odp-*` prefixes the org's own abbreviation onto repositories that are
already inside the org; `object-digital-passport` repeats the org name in full. Both spend
characters on context the reader already has from the URL.

## 2. What c2pa-org does

Their org page is worth copying because the names carry no redundancy at all:

`specifications` · `public-testfiles` · `conformance-public` · `softbinding-algorithm-list` ·
`conformance-explorer` · `c2pa-org.github.io`

Every name is the **role of that repository inside the project**, said in the fewest words that
stay unambiguous. Nothing is prefixed `c2pa-`, because `c2pa-org/` is already in front of it. The
one exception is the Pages repository, whose name GitHub dictates.

## 3. Proposed names

| Now | Proposed | Why |
|---|---|---|
| `object-digital-passport` | **`specification`** | It is the standard: `SPEC.md`, the contracts implementing it, the schema and the vectors that check it. Since the 0.7 line it holds nothing else. |
| `odp-apple-app` | **`ios-app`** | The platform, and nothing else. `apple` is ambiguous now that the same target builds for macOS; `ios-app` is what people search for. |
| `odp-android-companion` | **`android-verifier`** | "Companion" describes a relationship to something else. This repository scans NFC seals and verifies — say that. |
| `object-digital-passport.github.io` | *unchanged* | GitHub requires this exact name for the organization site. Not a choice. |
| `demo-repository` | **delete** | GitHub's sample repository. It has never held project content. |

Deliberately not proposed: renaming to `spec`. The repository holds contracts and vectors as well
as prose, and `specification` matching c2pa's `specifications` makes the kinship legible to anyone
who arrives from that world.

## 4. What each rename breaks

GitHub keeps a redirect from the old name — for the web UI, the API, and `git clone` — for as long
as nothing else claims it. That covers most of the damage, but not all of it:

- **GitHub Pages does not redirect.** Renaming `object-digital-passport` moves the rendered
  specification from `…github.io/specifications/spec/` to `…github.io/specification/spec/`.
  Every legacy `.html` redirect stub built by [`pages.yml`](../.github/workflows/pages.yml) moves
  with it. Any QR or `.odpass` file that was ever printed with a `/object-digital-passport/` URL in
  it stops resolving.
  *Mitigation:* §12.2 of `SPEC.md` already removed the hostname from what is printed on an object,
  so nothing minted under the 0.7 rules carries a site address at all. Objects passported before
  that rule do. **Check that before renaming**, not after.
- **Anyone's existing clone** keeps pushing to the old URL through the redirect, silently. Fine,
  but worth telling contributors once.
- **Absolute links inside this repository** — `README.md`, `SPEC.md`, `CHANGELOG.md`,
  `docs/releases/*`, the profile README — hard-code the full `github.com/object-digital-passport/
  object-digital-passport/...` path in many places. These follow the redirect, so they do not
  break; they just become wrong to read. Rewrite them in the same change.
- **Published GitHub Releases** quote URLs in their bodies. Those are stored text; they do not
  update themselves.
- **The `.github` profile README** must be re-synced by hand, because it lives in a repository
  this tooling cannot reach (see [`.github/profile/PUBLISH.md`](../.github/profile/PUBLISH.md)).
- **Badge URLs** in `README.md` embed the repository path twice each.
- **Shortcut references** — Discussions, the Wiki, issue templates, `dependabot.yml` labels — do
  not break, but should be read through once.

Suggested order: rename the two app repositories first. They are private, have no Pages, and
almost nothing links to them, so they cost nothing and prove the process. Rename the main
repository last, in its own commit, with the link rewrite in the same pull request.

## 5. The site address

**The requested `odp.github.io` cannot be had.** `github.com/odp` is an existing user account
(17 public repositories, active), and `<name>.github.io` is only served for a user or organization
that actually owns `<name>`. There is no way to claim it and no queue to wait in.

Three routes to a shorter address, in the order they are worth considering:

### A. A custom domain — recommended

This is precisely what the c2pa comparison is: their organization is `c2pa-org` *because* `c2pa`
was unavailable, and their public site is **`c2pa.org`**, a purchased domain pointed at Pages. The
awkward org name stops mattering the moment nothing published points at it.

- Buy a domain — `odpass.org`, `objectpassport.org`, whatever is free and says the thing.
- In the **website** repository: add a `CNAME` file containing the bare domain, set it under
  **Settings → Pages → Custom domain**, and switch on **Enforce HTTPS**.
- The `…github.io` addresses keep resolving and redirect to the custom domain, so nothing already
  printed or linked dies.
- Cost is the registration; renewal is the only recurring commitment, and letting it lapse would
  break every link that used it. For a project whose pitch is *"this will still verify in 250
  years"*, a domain that must be renewed is a real dependency — worth registering for the longest
  term the registrar sells, and worth being honest about in `SPEC.md`.

### B. Rename the organization

`odpass` and `odp-org` are both free on GitHub as of this writing. Renaming the org to `odpass`
would give `odpass.github.io`, and shorten every repository URL at once.

Against it: an organization rename changes **every** URL the project has ever published in one
move, and unlike a repository rename it also renames the Pages host — the redirect story is worse,
not better. If a domain is going to be bought anyway (route A), the org name stops being visible
and this buys nothing.

### C. Change nothing, and shorten what is *published* instead

The address that is actually long in practice is
`object-digital-passport.github.io/verify.html` — the org name twice and a
file extension. But that is the **legacy** path: the website moved out in the 0.7 line, and the
live address is already `object-digital-passport.github.io/verify.html`.

Much of this repository still links to the old form — 43 occurrences of the doubled path against
16 of the current one at the time of writing. Those all resolve, via the redirect stubs in
`pages.yml`, which is why nobody has noticed. Rewriting them to the current address is free, breaks
nothing, and removes most of the perceived length without buying or renaming anything.

**Do C regardless — it is a strict cleanup.** Then decide between A and B; they are alternatives,
not steps.

## 6. Suggested sequence

1. Rewrite the legacy doubled site URLs to the current ones. *(no risk, do it now)*
2. Delete `demo-repository`. *(no risk)*
3. Rename `odp-apple-app` → `ios-app` and `odp-android-companion` → `android-verifier`. *(private, cheap)*
4. Decide on a domain. If yes, register it and point the website repository at it.
5. Audit what pre-0.7 passports carry as a printed URL. Only then rename the main repository.
