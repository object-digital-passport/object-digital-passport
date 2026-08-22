/**
 * Checks every file in docs/releases/ against .github/RELEASE_TEMPLATE.md.
 *
 * A style guide nobody can run decays within two releases. This catches the mechanical half:
 * missing sections, changelog vocabulary that leaked into a release note, and relative links —
 * which work in the repo and break on the release page as soon as a directory moves.
 *
 * It cannot check whether the prose is actually readable. That stays a human job.
 *
 * Run: node chain/tools/lint_release_notes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = path.join(root, "docs", "releases");

const INTRO =
  "ODP is a free, open digital passport for real objects — art, limited runs, archives — that anyone can verify. Forever.";
const NEW_HERE =
  "**New here?** [What this is](https://github.com/object-digital-passport/object-digital-passport#readme) · " +
  "[Verify something — free, no wallet](https://object-digital-passport.github.io/verify.html)";

const SECTIONS = ["## What changed", "## Do I need to do anything?", "## Where it lives", "## Full detail", "## Status"];

// Rule 2 of the template. Each entry is [pattern, what to write instead].
const BANNED = [
  [/\bEIP-170\b/, "say “the size limit the network enforces”"],
  [/\bEIP-712\b/, "say “a signature format wallets can show in readable form”"],
  [/\bbitmask\b/i, "say what the flags mean"],
  [/\bdomain separator\b/i, "changelog only"],
  [/packed\s+CONTRACT_VERSION/, "say “each version is a separate registry”"],
  [/\bEC\(\d+\)/, "error codes are changelog vocabulary"],
  [/\banchorTypesMask\b|\bdataUrlIsFolderBase\b|\bmintOnBehalfOfCreatorId\b/, "ABI names are changelog vocabulary"],
  [/\bSPEC\s*§/, "link the section or say the rule in words"],
  [/(?:^|\s)(?:chain|web|docs|schema)\/[\w./-]+/m, "repo paths as prose — link them or drop them"],
];

if (!fs.existsSync(dir)) {
  console.error("docs/releases/ does not exist");
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
if (!files.length) {
  console.error("docs/releases/ has no release notes in it");
  process.exit(1);
}

let failures = 0;
const note = (file, line, msg) => {
  console.error(`  ${file}${line ? ":" + line : ""} — ${msg}`);
  failures++;
};

for (const file of files) {
  const text = fs.readFileSync(path.join(dir, file), "utf8");
  const lines = text.split("\n");

  // The title carries the whole promise of the note: a version and six words of plain language.
  const title = /^# ODP (v[\d.]+) — (.+)$/.exec(lines[0] || "");
  if (!title) {
    note(file, 1, `title must read "# ODP vX.Y — <plain-language subtitle>"`);
  } else if (title[2].split(/\s+/).length > 6) {
    note(file, 1, `subtitle is ${title[2].split(/\s+/).length} words — the template allows six`);
  }

  // The header block is fixed line for line. Byte-identical, not merely similar: a sentence
  // wrapped differently in one file is a different file to a reviewer reading a diff.
  if (lines[1] !== "") note(file, 2, "line 2 must be blank");
  if (lines[2] !== INTRO) {
    note(file, 3, "line 3 must be the opening sentence, on one line, identical in every note");
  }
  if (lines[3] !== "") note(file, 4, "line 4 must be blank");
  if (lines[4] !== NEW_HERE) {
    note(file, 5, 'line 5 must be the "**New here?**" line, with both canonical links');
  }

  // An optional standfirst: one paragraph, at line 7, opening with a bold clause so the eye
  // knows it is not body text. Present in some notes and absent in others — but never
  // formatted two different ways, which is what makes one note look unlike its neighbours.
  if (lines[6] && !lines[6].startsWith("## ")) {
    if (!lines[6].startsWith("**")) {
      note(file, 7, "a standfirst must open with a bold clause, or be dropped");
    }
    if (lines[7] !== "") note(file, 8, "the standfirst must be a single paragraph");
    if (!(lines[8] || "").startsWith("## ")) note(file, 9, "only one paragraph may precede the sections");
  }

  // Headings are ## and nothing else: a ### renders smaller and makes one note look unlike
  // its neighbours, which is the class of drift this whole file exists to stop.
  lines.forEach((l, i) => {
    const h = /^(#{1,6})\s/.exec(l);
    if (!h) return;
    if (i === 0 && h[1] !== "#") note(file, 1, "the title is a single #");
    if (i > 0 && h[1] !== "##") note(file, i + 1, `"${h[1]}" heading — sections are ## only`);
  });

  // Sections are fixed: not reordered, not renamed, not dropped, and not added to.
  const found = lines.filter((l) => l.startsWith("## ")).map((l) => l.trim());
  if (found.join("|") !== SECTIONS.join("|")) {
    note(file, null, `sections are ${JSON.stringify(found)} — the template fixes them as ${JSON.stringify(SECTIONS)}`);
  }

  // fenced blocks are quoting, not prose
  let fenced = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return; }
    if (fenced) return;

    for (const [pattern, advice] of BANNED) {
      const m = line.match(pattern);
      if (m) note(file, i + 1, `“${m[0].trim()}” — ${advice}`);
    }

    for (const m of line.matchAll(/\]\(([^)]+)\)/g)) {
      const target = m[1];
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      note(file, i + 1, `relative link “${target}” — release pages need absolute URLs`);
    }
  });

  if (lines.length > 45) note(file, null, `${lines.length} lines — release notes stay under ~35`);
}

if (failures) {
  console.error(`\n${failures} problem(s) across ${files.length} release note(s).`);
  console.error("Rules: .github/RELEASE_TEMPLATE.md");
  process.exit(1);
}
console.log(`release notes ok — ${files.length} checked against .github/RELEASE_TEMPLATE.md`);
