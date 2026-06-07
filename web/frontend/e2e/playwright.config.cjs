const path = require("path");
const { defineConfig } = require("@playwright/test");

const webRoot = path.join(__dirname, "../..");

module.exports = defineConfig({
  testDir: ".",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:4174",
    browserName: "firefox",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "bash -c 'TMP=$(mktemp -d) && cp -r frontend/. \"$TMP/\" && cp -r backend \"$TMP/backend\" && cd \"$TMP\" && python3 -m http.server 4174'",
    cwd: webRoot,
    url: "http://127.0.0.1:4174",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
