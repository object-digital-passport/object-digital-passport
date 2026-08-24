#!/usr/bin/env node
// Checks that the Russian documentation has not drifted away from the English.
//
// Why this exists: docs/ru/GUIDE.md told Russian readers for a month that the live pages
// talked to the v0.5 registry, while v0.6 had been live on Polygon since 24 July and the
// English guide said so. Nothing reported it. Full parity doubles the surface where that
// can happen, so the surface gets a check.
//
// The record of what is translated lives in docs/TRANSLATIONS.md, as a table a human reads.
// This script is the enforcement of that table, not a second copy of it.
//
// Hard failures (exit 1):
//   1. an English document that appears in no row of the table
//   2. a row naming a file that does not exist
//   3. a file under docs/ru/ that no row accounts for
//
// Soft findings (reported, exit 0):
//   4. identifiers present in an English document and absent from its translation
//   5. a translation whose last commit is older than its original's
//
// Soft findings describe a backlog that predates the table (issue #118 and its children).
// When that backlog is empty, promote rule 4 to hard — the check is written so that means
// moving one push() call.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve, sep } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(repoRoot, "docs", "TRANSLATIONS.md");
const showAll = process.argv.includes("--all");

// ---------------------------------------------------------------- the manifest

// Rows look like: | `English.md` | `docs/ru/Russian.md` | status |
// Either side may be an em dash, meaning "no counterpart".
const rows = [];
for (const line of readFileSync(manifestPath, "utf8").split("\n")) {
  const cells = line.match(/^\|(.+)\|$/)?.[1].split("|").map((c) => c.trim());
  if (!cells || cells.length !== 3) continue;
  if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue; // the |---|---|---| separator
  const unwrap = (c) => (c === "—" ? null : c.replace(/^`|`$/g, ""));
  const [en, ru, status] = [unwrap(cells[0]), unwrap(cells[1]), cells[2]];
  // Skip the status-vocabulary table and the header row.
  if (!status || status === "Meaning" || status === "Status") continue;
  if (!en && !ru) continue;
  rows.push({ en, ru, status: status.replace(/`/g, "") });
}

if (rows.length === 0) {
  console.error("check-translations: docs/TRANSLATIONS.md has no table rows — has it moved?");
  process.exit(1);
}

// ---------------------------------------------------------------- the tree

// Every English document the table has to account for: markdown at the root and under
// docs/, excluding docs/ru/ (which is the other side of the pairing) and this file.
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const rel = (p) => relative(repoRoot, p).split(sep).join("/");

const englishDocs = [
  ...readdirSync(repoRoot)
    .filter((n) => n.endsWith(".md") && n !== "README.ru.md")
    .map((n) => join(repoRoot, n)),
  ...walk(join(repoRoot, "docs")).filter((p) => p.endsWith(".md")),
]
  .map(rel)
  .filter((p) => !p.startsWith("docs/ru/"))
  .sort();

const russianDocs = walk(join(repoRoot, "docs", "ru"))
  .filter((p) => p.endsWith(".md"))
  .map(rel)
  .concat(existsSync(join(repoRoot, "README.ru.md")) ? ["README.ru.md"] : [])
  .sort();

// A row's English cell may be a directory glob, e.g. `docs/adr/*`.
const covers = (pattern, path) =>
  pattern.endsWith("/*") ? path.startsWith(pattern.slice(0, -1)) : pattern === path;

const failures = [];

// Rule 1 — every English document is declared.
for (const doc of englishDocs) {
  if (!rows.some((r) => r.en && covers(r.en, doc))) {
    failures.push(
      `${doc} — no row in docs/TRANSLATIONS.md.\n` +
        `      Add one and pick a status: translated, planned, or none: <reason>.`,
    );
  }
}

// Rule 2 — every path a row names exists.
for (const { en, ru } of rows) {
  for (const path of [en, ru]) {
    if (!path || path.endsWith("/*")) continue;
    if (!existsSync(join(repoRoot, path))) {
      failures.push(`${path} — named in docs/TRANSLATIONS.md, but no such file.`);
    }
  }
}

// Rule 3 — every Russian document is accounted for.
for (const doc of russianDocs) {
  if (!rows.some((r) => r.ru === doc)) {
    failures.push(
      `${doc} — no row in docs/TRANSLATIONS.md.\n` +
        `      Every Russian file needs an owner: a pair, or "russian only".`,
    );
  }
}

// ---------------------------------------------------------------- soft findings

// Identifiers that must read identically in both languages. Translating one of these
// does not make a sentence Russian, it makes the document wrong.
const isIdentifier = (word) =>
  /_/.test(word) ||
  /[a-z][A-Z]/.test(word) ||
  /^[A-Z]{2,}[a-z]/.test(word) ||
  /^[A-Z][a-z]+[A-Z]/.test(word);

const identifiers = (path) => {
  const text = readFileSync(join(repoRoot, path), "utf8");
  const found = new Set();
  for (const m of text.matchAll(/0x[0-9a-fA-F]{40}/g)) found.add(m[0].toLowerCase());
  for (const m of text.matchAll(/\bv0\.\d+(?:\.\d+)?\b/g)) found.add(m[0]);
  for (const m of text.matchAll(/`+([A-Za-z_][A-Za-z0-9_]{2,})`+/g)) {
    if (isIdentifier(m[1])) found.add(m[1]);
  }
  return found;
};

const lastCommit = (path) => {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%ct", "--", path], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    return out ? Number(out) : null;
  } catch {
    return null;
  }
};

const drift = [];
const stale = [];

for (const { en, ru, status } of rows) {
  if (status !== "translated" || !en || !ru) continue;

  // Rule 4 — identifiers the translation is missing.
  const missing = [...identifiers(en)].filter((id) => !identifiers(ru).has(id));
  if (missing.length > 0) drift.push({ en, ru, missing });

  // Rule 5 — the original was edited after the translation.
  const [enAt, ruAt] = [lastCommit(en), lastCommit(ru)];
  if (enAt && ruAt && ruAt < enAt) stale.push({ en, ru, enAt, ruAt });
}

// ---------------------------------------------------------------- report

const day = (seconds) => new Date(seconds * 1000).toISOString().slice(0, 10);

if (drift.length > 0) {
  console.log(`check-translations: ${drift.length} translation(s) missing identifiers\n`);
  for (const { en, ru, missing } of drift) {
    const shown = showAll ? missing : missing.slice(0, 8);
    console.log(`  ${ru}`);
    console.log(`    missing from the Russian, present in ${en}:`);
    console.log(`    ${shown.join(" ")}${missing.length > shown.length ? ` … and ${missing.length - shown.length} more` : ""}`);
  }
  console.log("");
}

if (stale.length > 0) {
  console.log(`check-translations: ${stale.length} translation(s) older than their original\n`);
  for (const { en, ru, enAt, ruAt } of stale) {
    console.log(`  ${ru} last touched ${day(ruAt)}, ${en} last touched ${day(enAt)}`);
  }
  console.log("");
}

if (failures.length > 0) {
  console.error(`check-translations: ${failures.length} document(s) unaccounted for\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error("\nThe record of what is translated is docs/TRANSLATIONS.md. Add the row there.");
  process.exit(1);
}

const pairs = rows.filter((r) => r.status === "translated").length;
const planned = rows.filter((r) => r.status === "planned").length;
console.log(
  `check-translations: ${englishDocs.length} English document(s) accounted for, ` +
    `${pairs} translated, ${planned} planned` +
    (drift.length || stale.length ? ` — ${drift.length + stale.length} soft finding(s) above` : ""),
);
