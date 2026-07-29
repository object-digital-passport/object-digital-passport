#!/usr/bin/env bash
# Update the GitHub Wiki navigation (_Sidebar.md and _Footer.md).
#
# Why a script: the wiki lives in a SEPARATE git repository
# (object-digital-passport.wiki.git) that is not a submodule of this repo and
# cannot be edited through a pull request. Run this locally, where your git
# credentials can push to it.
#
# Usage:
#   bash docs/scripts/update-wiki-nav.sh
#
# It clones the wiki to a temp dir, writes the two navigation files, shows you
# the diff, and asks before pushing. Page names in the sidebar must match the
# actual wiki page files; the script verifies that before offering to push.
#
# Author: Andrei Chernikov

set -euo pipefail

WIKI_URL="https://github.com/object-digital-passport/object-digital-passport.wiki.git"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "  Cloning wiki into $WORKDIR ..."
git clone --quiet "$WIKI_URL" "$WORKDIR/wiki"
cd "$WORKDIR/wiki"

cat > _Sidebar.md <<'SIDEBAR'
**Object Digital Passport**

**🇬🇧 English**

- [Home](Home)
- [Quick Start](Quick-Start)
- [How Verification Works](How-Verification-Works)
- [NFC Seals](NFC-Seals)
- [Object ID Profile](Object-ID-Profile)
- [FAQ](FAQ)

**🇷🇺 Русский**

- [Главная](Home-ru)
- [Быстрый старт](Quick-Start-ru)
- [Как работает проверка](How-Verification-Works-ru)
- [NFC-пломбы](NFC-Seals-ru)
- [Object ID и профиль](Object-ID-Profile-ru)
- [Вопросы и ответы](FAQ-ru)

---

[Demo](https://object-digital-passport.github.io/object-digital-passport/) ·
[Spec](https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md) ·
[Repo](https://github.com/object-digital-passport/object-digital-passport)
SIDEBAR

cat > _Footer.md <<'FOOTER'
**Object Digital Passport** — open standard, MIT licensed. These wiki pages are friendly explanations; the normative source is [`SPEC.md`](https://github.com/object-digital-passport/object-digital-passport/blob/main/SPEC.md) (English). Questions and corrections → [Discussions](https://github.com/object-digital-passport/object-digital-passport/discussions) (in English, so everyone can follow).
FOOTER

# Guard: a sidebar link pointing at a page that does not exist renders as a
# dead "create this page" link for every visitor, so refuse to push in that case.
echo "  Checking that every sidebar link points at a real page ..."
missing=0
while read -r target; do
  case "$target" in http*) continue ;; esac
  if [ ! -f "${target}.md" ]; then
    echo "    MISSING: ${target}.md"
    missing=1
  fi
done < <(grep -o '](\([^)]*\))' _Sidebar.md | sed 's/^](//; s/)$//')

if [ "$missing" -ne 0 ]; then
  echo "  Aborting: fix the page names above (wiki page files are case-sensitive)."
  exit 1
fi
echo "  All sidebar links resolve."

if git diff --quiet && [ -z "$(git status --porcelain)" ]; then
  echo "  Wiki navigation is already up to date — nothing to push."
  exit 0
fi

echo
git --no-pager diff
git status --short
echo
read -r -p "  Push these navigation changes to the wiki? [y/N] " reply
case "$reply" in
  [yY]*)
    git add _Sidebar.md _Footer.md
    git commit -q -m "wiki: bilingual sidebar (both language trees) and a footer"
    # The wiki's default branch is master, not main.
    git push origin master
    echo "  Pushed. Check https://github.com/object-digital-passport/object-digital-passport/wiki"
    ;;
  *)
    echo "  Aborted — nothing pushed."
    ;;
esac
