# Wiki staging — v0.6 alignment

Updated GitHub Wiki pages, staged here because CI/remote sessions cannot push to
`object-digital-passport.wiki.git`. Once these pages are published to the real
wiki, this directory can be deleted from the repository.

**What changed:** the pages were aligned with the actual v0.6 model — the
on-chain card, the `anchors[]` identification block with its hard mint-time
minimum, append-only events, optional seals — and stale links (removed
`OBJECTID_PROFILE.md`, old SPEC anchors, a nonexistent JSON-schema file) were
fixed. `NFC-Seals` no longer claims spec-defined "Profiles A/B" that the SPEC
does not contain.

## To publish (maintainer, one command block)

```bash
git clone https://github.com/object-digital-passport/object-digital-passport.wiki.git odp-wiki
cp wiki-staging/*.md odp-wiki/ && rm odp-wiki/README.md
cd odp-wiki && git add -A && git commit -m "Align wiki with the actual v0.6 model" && git push
```

(`rm odp-wiki/README.md` removes this staging note — it is not a wiki page.)
