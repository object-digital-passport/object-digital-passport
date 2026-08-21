// Renders repository markdown (SPEC.md, profile docs) into the static /spec/
// section of the GitHub Pages site. Zero runtime JS on the output pages.
//
// Usage: node web/pages/build-spec.mjs <output-dir>
// Run `npm install --prefix web/pages` first (marked + heading ids).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outDir = process.argv[2];
if (!outDir) {
  console.error("Usage: node build-spec.mjs <output-dir>");
  process.exit(1);
}

const PAGES = [
  {
    src: "SPEC.md",
    out: "index.html",
    title: "ODP Specification v0.6",
  },
  {
    src: "docs/OBJECTID_PROFILE.md",
    out: "objectid-profile.html",
    title: "ODP · Object ID Compatibility Profile",
  },
  {
    src: "docs/SECURITY.md",
    out: "security.html",
    title: "ODP · Security Model",
  },
];

const NAV = [
  ["index.html", "Specification"],
  ["objectid-profile.html", "Object ID Profile"],
  ["security.html", "Security Model"],
  ["schema/passport-0.6.schema.json", "JSON Schema"],
  // Absolute: the demo is a separate deployment, and will be a separate repository.
  ["https://object-digital-passport.github.io/object-digital-passport/demo/", "Live demo →"],
];

const CSS = `
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body {
  margin: 0; padding: 0 16px 64px;
  font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #fff; color: #1c1e26;
}
main { max-width: 880px; margin: 0 auto; }
nav.site {
  max-width: 880px; margin: 0 auto; padding: 14px 0;
  border-bottom: 1px solid #d8dbe4; display: flex; flex-wrap: wrap; gap: 6px 18px;
  font-size: 14px;
}
nav.site a { color: #2b4c9b; text-decoration: none; }
nav.site a.current { font-weight: 700; }
nav.site a:hover { text-decoration: underline; }
nav.site .home { font-weight: 700; color: inherit; margin-right: auto; }
h1, h2, h3, h4 { line-height: 1.25; scroll-margin-top: 16px; }
h1 { font-size: 1.9em; } h2 { margin-top: 2em; border-bottom: 1px solid #d8dbe4; padding-bottom: .25em; }
a { color: #2b4c9b; }
code {
  font: 0.9em/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: #f0f1f5; border-radius: 4px; padding: .1em .35em;
}
pre { background: #f0f1f5; border-radius: 8px; padding: 14px; overflow-x: auto; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; display: block; overflow-x: auto; max-width: 100%; }
th, td { border: 1px solid #d8dbe4; padding: 6px 10px; text-align: left; vertical-align: top; }
th { background: #f0f1f5; }
blockquote { margin: 1em 0; padding: .1em 16px; border-left: 4px solid #2b4c9b; background: #f6f7fa; }
img { max-width: 100%; }
footer.site { max-width: 880px; margin: 48px auto 0; padding-top: 14px;
  border-top: 1px solid #d8dbe4; font-size: 13px; color: #6a6f80; }
@media (prefers-color-scheme: dark) {
  body { background: #14161d; color: #d7dae3; }
  nav.site, h2, footer.site { border-color: #2c3040; }
  nav.site a, a { color: #8ab0ff; }
  code, pre, th { background: #1e222e; }
  th, td { border-color: #2c3040; }
  blockquote { background: #191d28; border-left-color: #8ab0ff; }
}
`;

function wrap(title, current, bodyHtml) {
  const nav = NAV.map(([href, label]) => {
    const cls = href === current ? ' class="current"' : "";
    return `<a href="${href}"${cls}>${label}</a>`;
  }).join("\n    ");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${CSS}</style>
</head>
<body>
  <nav class="site">
    <a class="home" href="../">Object Digital Passport</a>
    ${nav}
  </nav>
  <main>
${bodyHtml}
  </main>
  <footer class="site">Generated from repository markdown at deploy time ·
    <a href="https://github.com/object-digital-passport/object-digital-passport">source on GitHub</a> · MIT License</footer>
</body>
</html>
`;
}

// Repo-relative markdown links don't exist on the rendered site — send them to GitHub blob URLs.
const GITHUB_BLOB =
  "https://github.com/object-digital-passport/object-digital-passport/blob/main/";
const LOCAL_TARGETS = new Map([
  ["SPEC.md", "index.html"],
  ["docs/OBJECTID_PROFILE.md", "objectid-profile.html"],
  ["../SPEC.md", "index.html"],
  ["../docs/OBJECTID_PROFILE.md", "objectid-profile.html"],
  ["OBJECTID_PROFILE.md", "objectid-profile.html"],
  ["SECURITY.md", "security.html"],
  ["docs/SECURITY.md", "security.html"],
  ["../schema/passport-0.6.schema.json", "schema/passport-0.6.schema.json"],
  ["schema/passport-0.6.schema.json", "schema/passport-0.6.schema.json"],
]);

function rewriteHref(href, srcDir) {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const [pathPart, hash = ""] = href.split("#");
  const anchor = hash ? `#${hash}` : "";
  if (LOCAL_TARGETS.has(pathPart)) return LOCAL_TARGETS.get(pathPart) + anchor;
  // Everything else that lives in the repo: point at GitHub.
  const abs = path.posix.normalize(path.posix.join(srcDir, pathPart));
  return GITHUB_BLOB + abs + anchor;
}

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(outDir, "schema"), { recursive: true });
// Publish every schema, not just the current one: each carries an $id pointing here, and an
// $id that 404s is worse than no $id at all.
for (const f of fs.readdirSync(path.join(repoRoot, "schema")).filter((n) => n.endsWith(".schema.json"))) {
  fs.copyFileSync(path.join(repoRoot, "schema", f), path.join(outDir, "schema", f));
  console.log(`spec: schema/${f}`);
}

for (const page of PAGES) {
  const srcPath = path.join(repoRoot, page.src);
  const srcDir = path.posix.dirname(page.src);
  const md = fs.readFileSync(srcPath, "utf8");
  const marked = new Marked();
  marked.use(gfmHeadingId());
  marked.use({
    renderer: {
      link(href, title, text) {
        const t = title ? ` title="${title}"` : "";
        return `<a href="${rewriteHref(href, srcDir)}"${t}>${text}</a>`;
      },
    },
  });
  const body = marked.parse(md);
  fs.writeFileSync(path.join(outDir, page.out), wrap(page.title, page.out, body));
  console.log(`spec: ${page.src} -> ${page.out}`);
}
