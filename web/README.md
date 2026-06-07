# web/

Reference static site for Object Digital Passport (GitHub Pages).

| Path | Role |
|------|------|
| [`frontend/`](frontend/) | HTML pages, CSS, UI scripts, i18n (`localization/`) |
| [`backend/`](backend/) | On-chain client layer: contract ABI helpers, WalletConnect bundle, `registry-config.json` |

There is no Node server — **backend** here means browser-side registry/RPC logic, not a remote API.

## Local preview

```bash
# From repo root — same layout as Pages deploy:
TMP=$(mktemp -d) && cp -r web/frontend/. "$TMP/" && cp -r web/backend "$TMP/backend" && cd "$TMP" && python3 -m http.server 8080
# → http://127.0.0.1:8080/verify.html
```

## WalletConnect bundle rebuild

```bash
cd backend && npm install && npm run build:wc
```

## E2E smoke

```bash
cd frontend/e2e && npm install && npx playwright test
```
