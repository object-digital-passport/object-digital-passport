/**
 * Runs in <head> before <body> paint. Must mirror STORAGE_KEY + rules in odp-i18n.js (odpResolveLocale).
 * Hides body via html.odp-i18n-pending until odpInitI18n finishes (see odp.css + odp-i18n.js reveal).
 */
(function (g) {
  "use strict";
  var STORAGE_KEY = "odp_locale";
  /* Failsafe: reveal page if odp-i18n.js does not complete; keep in sync with related CSS/JS timing. */
  var FAILSAFE_REVEAL_TIMEOUT_MS = 2800;
  function resolve() {
    try {
      var s = g.localStorage && g.localStorage.getItem(STORAGE_KEY);
      if (s === "en" || s === "ru") return s;
    } catch (e0) {}
    var nav = (g.navigator && g.navigator.language) || "en";
    nav = String(nav).toLowerCase();
    if (nav.startsWith("ru")) return "ru";
    return "en";
  }
  if (g.document && g.document.documentElement && resolve() === "ru") {
    g.document.documentElement.classList.add("odp-i18n-pending");
  }
  /* If odp-i18n.js never runs or fetch hangs, do not leave body hidden forever */
  g.setTimeout(function () {
    try {
      var h = g.document && g.document.documentElement;
      if (!h || !h.classList) return;
      if (h.classList.contains("odp-i18n-pending")) {
        h.classList.remove("odp-i18n-pending");
        h.classList.add("odp-i18n-ready");
      }
    } catch (e1) {}
  }, FAILSAFE_REVEAL_TIMEOUT_MS);
})(typeof window !== "undefined" ? window : globalThis);
