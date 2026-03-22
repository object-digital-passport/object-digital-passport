ODP web UI strings (JSON per locale and page).

Layout:
  en/common.json   — shared (nav, footer, registry hints, language switcher)
  en/<page>.json   — creator | passport | verify | index
  ru/…             — same filenames; Russian overrides merged over English in odp-i18n.js

The static site loads these from /i18n/… (repo root). GitHub Actions copies this folder into the Pages artifact. Pages opened as /web/*.html resolve ../i18n/ automatically.

Spec and legal text remain English in the repository; UI copy may be translated here.
