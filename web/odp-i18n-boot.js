/**
 * Runs in <head> before <body> paint. Must mirror STORAGE_KEY + rules in odp-i18n.js (odpResolveLocale).
 * Hides body via html.odp-i18n-pending until odpInitI18n finishes (see odp.css + odp-i18n.js reveal).
 */
(function (g) {
  "use strict";
  var STORAGE_KEY = "odp_locale";
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
})(typeof window !== "undefined" ? window : globalThis);
