# Static smoke (Playwright)

Loads `verify.html` and `passport.html` over a local static server (`python3 -m http.server` of the repository root). **No wallet** and **no chain** — this only catches broken HTML/JS wiring after refactors.

## Run

```bash
cd e2e
npm install
npx playwright install firefox
npm test
```

The first `playwright install firefox` downloads the Firefox test browser (~tens of MB).

On first run, Playwright starts `python3 -m http.server 4174` with cwd = repo root.

## CI

Set `CI=1` if you want to fail when port **4174** is already in use (`reuseExistingServer` is off in CI).
