#!/usr/bin/env bash
# Creates a GitHub Discussion from docs/community/discussion-passport-ui-v0.4-EN.md
# Prerequisites: gh CLI (https://cli.github.com/), `gh auth login`, Discussions enabled on the repo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOC="$ROOT/docs/community/discussion-passport-ui-v0.4-EN.md"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: https://cli.github.com/  then: gh auth login" >&2
  exit 1
fi

if [[ ! -f "$DOC" ]]; then
  echo "Missing: $DOC" >&2
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
if [[ -z "${REPO:-}" ]]; then
  echo "Run from a git clone with gh, or: gh repo set-default object-digital-passport/object-digital-passport" >&2
  exit 1
fi

OWNER="${REPO%%/*}"
NAME="${REPO##*/}"

TFILE=$(mktemp)
BFILE=$(mktemp)
trap 'rm -f "$TFILE" "$BFILE"' EXIT

python3 - "$DOC" "$TFILE" "$BFILE" <<'PY'
import re, sys
path, tpath, bpath = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(path, encoding="utf-8").read()
m = re.match(r"^#\s+(.+?)\s*\n", text)
title = m.group(1).strip() if m else "Discussion"
body = text[m.end() :] if m else text
body = re.sub(r"\n---\s*\n\*Maintainers:.*$", "", body, flags=re.S).strip()
open(tpath, "w", encoding="utf-8").write(title)
open(bpath, "w", encoding="utf-8").write(body)
PY

REPO_ID=$(gh api graphql -f query='query($o:String!,$n:String!){repository(owner:$o,name:$n){id}}' -f o="$OWNER" -f n="$NAME" --jq '.data.repository.id')

CAT_ID=$(gh api graphql -f query='query($o:String!,$n:String!){repository(owner:$o,name:$n){discussionCategories(first:20){nodes{id name}}}}' -f o="$OWNER" -f n="$NAME" --jq '.data.repository.discussionCategories.nodes' | python3 -c '
import json, sys
nodes = json.load(sys.stdin)
order = ["Ideas", "General", "Q&A", "Announcements"]
for name in order:
    for n in nodes:
        if n.get("name") == name:
            print(n["id"])
            raise SystemExit(0)
if nodes:
    print(nodes[0]["id"])
')

if [[ -z "${CAT_ID:-}" ]]; then
  echo "No discussion categories found. Enable: repo Settings → General → Features → Discussions." >&2
  exit 1
fi

URL=$(gh api graphql -f query='
mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
  createDiscussion(input: {repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body}) {
    discussion { url }
  }
}' -f repositoryId="$REPO_ID" -f categoryId="$CAT_ID" -f title=@"$TFILE" -f body=@"$BFILE" --jq '.data.createDiscussion.discussion.url')

echo "Created: $URL"
