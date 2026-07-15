# Wiki source pages

Source for the [GitHub wiki](https://github.com/object-digital-passport/object-digital-passport/wiki). Edit here (normal PR review), then publish:

```bash
git clone https://github.com/object-digital-passport/object-digital-passport.wiki.git /tmp/odp-wiki
cp docs/wiki/*.md /tmp/odp-wiki/
rm /tmp/odp-wiki/README.md   # these instructions are not a wiki page
cd /tmp/odp-wiki && git add -A && git commit -m "wiki: sync from docs/wiki" && git push
```

## Language convention (built to scale to 20+ languages)

- **English is the primary language.** Canonical pages have plain names: `Home`, `Quick-Start`, `NFC-Seals`, …
- **Translations** use the same name plus a lowercase [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) suffix: `Home-ru`, `Home-de`, `Quick-Start-fr`, … One file per page per language.
- **Language bar:** every page starts with one standard line right after the title:

  ```markdown
  > [🇬🇧 English](Home) · 🇷🇺 **Русский**
  ```

  The current language is bold (with its flag), others are links to the same page in that language. Flag emoji per language: 🇬🇧 en · 🇷🇺 ru · 🇩🇪 de · 🇫🇷 fr · 🇪🇸 es · 🇮🇹 it · 🇵🇹 pt · 🇨🇳 zh · 🇯🇵 ja · 🇰🇷 ko (pick the most recognizable flag for the language; it's a navigation aid, not a statement about countries). When adding a language, extend this bar on the pages you translate (only list languages that page actually exists in).
- **Sidebar stays small:** `_Sidebar.md` lists the English pages plus a *Languages* section linking only to each language's `Home-<code>`. Never list every page × language there — navigation within a language happens from its own Home page.
- **Internal links inside a translation** point to same-language pages (`[FAQ](FAQ-ru)`), falling back to English when a page isn't translated yet.
- **Adding a language, step by step:** copy the English pages to `<Page>-<code>.md`, translate, add the language (with its flag) to each translated page's language bar and to the *Languages* section of `_Sidebar.md`, publish. Partial translations are fine — start with `Home-<code>`.
- **English pages are the source of truth.** When an English page changes meaningfully, translations should follow; out-of-date translations are better than none, but flag big drifts in Discussions.
