# Wiki source pages

These markdown files are the source for the [GitHub wiki](https://github.com/object-digital-passport/object-digital-passport/wiki) (published, bilingual EN + RU, `_Sidebar.md` included). To publish updates:

```bash
git clone https://github.com/object-digital-passport/object-digital-passport.wiki.git /tmp/odp-wiki
cp docs/wiki/*.md /tmp/odp-wiki/          # README.md excluded on purpose:
rm /tmp/odp-wiki/README.md                # it's these instructions, not a wiki page
cd /tmp/odp-wiki
git add -A && git commit -m "wiki: friendly docs (Home, Quick Start, Verification, NFC, Object ID, FAQ)"
git push
```

**Updating later:** edit the files here (PR review applies), then repeat the copy+push. Page links use wiki-style names (`[Quick Start](Quick-Start)`), which resolve on the wiki, not in this folder — that's expected.
