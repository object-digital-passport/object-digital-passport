#!/usr/bin/env node
// Checks that every repository-relative link in the organization profile README still
// resolves to a file in this repository.
//
// The profile README lives here but renders on the organization page, out of a copy in the
// `.github` repository (see .github/profile/PUBLISH.md). Nothing on that page tells you when a
// link rots — a renamed doc just 404s for every visitor who arrives at the front door. So the
// links are written as absolute github.com URLs, and this turns them back into paths to check.
//
// External links (the website, polygonscan, the wiki, shields.io) are not checked: they live
// outside this repository and a network flake must not turn CI red.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readme = join(repoRoot, ".github", "profile", "README.md");
const REPO = "object-digital-passport/specifications";

const text = readFileSync(readme, "utf8");

// https://github.com/<owner>/<repo>/blob/main/<path>[#anchor]
const linkPattern = new RegExp(
  `https://github\\.com/${REPO}/blob/main/([^)\\s"'#]+)(#[^)\\s"']*)?`,
  "g",
);

const failures = [];
const seen = new Set();

for (const [, path, rawAnchor] of text.matchAll(linkPattern)) {
  const anchor = rawAnchor ? rawAnchor.slice(1) : null;
  const key = `${path}${anchor ? `#${anchor}` : ""}`;
  if (seen.has(key)) continue;
  seen.add(key);

  if (!existsSync(join(repoRoot, path))) {
    failures.push(`${path} — no such file in this repository`);
    continue;
  }
  if (anchor) {
    // GitHub derives a heading anchor by lowercasing, dropping anything that is not a letter,
    // digit, space or hyphen, then joining words with hyphens.
    const headings = readFileSync(join(repoRoot, path), "utf8")
      .split("\n")
      .filter((line) => line.startsWith("#"))
      .map((line) =>
        line
          .replace(/^#+\s*/, "")
          .trim()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s-]/gu, "")
          .replace(/\s+/g, "-"),
      );
    if (!headings.includes(anchor)) {
      failures.push(`${path}#${anchor} — the file exists, that heading does not`);
    }
  }
}

if (seen.size === 0) {
  console.error("check-profile-links: matched no links at all — the pattern or the README moved.");
  process.exit(1);
}

if (failures.length > 0) {
  console.error(`check-profile-links: ${failures.length} broken link(s) in .github/profile/README.md\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error("\nFix the link, or the file it points at. Then re-sync the org page — .github/profile/PUBLISH.md.");
  process.exit(1);
}

console.log(`check-profile-links: ${seen.size} repository link(s) OK`);
