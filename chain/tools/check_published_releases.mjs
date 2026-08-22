/**
 * Checks that every published GitHub Release body is byte-identical to its file in
 * docs/releases/.
 *
 * The files are the source of truth; the release page is a copy. Nothing enforced that, so
 * the copies drifted: v0.6 spent a month published as a draft written before the template
 * existed — its title was an h2, which is why that one release rendered in a smaller font
 * than its neighbours.
 *
 * Needs `gh` authenticated. Run: node chain/tools/check_published_releases.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = path.join(root, "docs", "releases");

const tags = execFileSync("gh", ["release", "list", "--limit", "50", "--json", "tagName", "-q", ".[].tagName"], {
  encoding: "utf8",
}).split("\n").filter(Boolean);

let bad = 0;
for (const tag of tags) {
  const file = path.join(dir, `${tag}.md`);
  if (!fs.existsSync(file)) {
    console.error(`  ${tag}: published, but docs/releases/${tag}.md does not exist`);
    bad++;
    continue;
  }
  const published = execFileSync("gh", ["release", "view", tag, "--json", "body", "-q", ".body"], {
    encoding: "utf8",
  }).replace(/\r\n/g, "\n").trimEnd();
  const local = fs.readFileSync(file, "utf8").trimEnd();
  if (published !== local) {
    const p = published.split("\n")[0];
    const l = local.split("\n")[0];
    console.error(`  ${tag}: published body differs from docs/releases/${tag}.md`);
    if (p !== l) console.error(`      published: ${p}\n      file:      ${l}`);
    bad++;
  }
}

// A note with no release is fine — v0.5 was deliberately never tagged. The reverse is not.
if (bad) {
  console.error(`\n${bad} release(s) out of sync. Fix with:`);
  console.error("  gh release edit <tag> --notes-file docs/releases/<tag>.md");
  process.exit(1);
}
console.log(`published release notes match docs/releases/ — ${tags.length} checked`);
