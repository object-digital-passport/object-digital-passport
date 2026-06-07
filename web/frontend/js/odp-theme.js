/**
 * ODP theme switcher — blue (light) / dark.
 * Load in <head> (before body renders) to avoid flash of wrong theme.
 * Persists choice in localStorage under `odp_theme`.
 * Labels: use window.odpT after i18n loads (keys in common.json theme.*).
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "odp_theme";
  var THEMES = ["blue", "dark"];
  var THEME_META = {
    blue: { emoji: "\u2600\uFE0F", colorScheme: "light", themeColor: "#2B4C9B" },
    dark: { emoji: "\uD83C\uDF19", colorScheme: "dark", themeColor: "#0f0e0c" },
  };

  function themeDisplayName(theme) {
    var T = global.odpT;
    var key = theme === "blue" ? "theme.nameBlue" : "theme.nameDark";
    if (typeof T === "function") {
      var v = T(key);
      if (v !== key) return v;
    }
    return theme === "blue" ? "Light (blue)" : "Dark";
  }

  function themeAriaLabel() {
    var T = global.odpT;
    if (typeof T === "function") {
      var v = T("theme.switchAria");
      if (v !== "theme.switchAria") return v;
    }
    return "Switch theme";
  }

  function themeTitleFor(theme) {
    var T = global.odpT;
    if (typeof T === "function") {
      var tpl = T("theme.switchTitle");
      if (tpl !== "theme.switchTitle" && tpl.indexOf("{name}") !== -1) {
        return tpl.replace("{name}", themeDisplayName(theme));
      }
      if (tpl !== "theme.switchTitle") return tpl + ": " + themeDisplayName(theme);
    }
    return "Theme: " + theme;
  }

  function getSaved() {
    try {
      var v = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (v && THEME_META[v]) return v;
    } catch (e) {}
    return null;
  }

  function currentTheme() {
    return getSaved() || "blue";
  }

  function applyTheme(theme) {
    if (!THEME_META[theme]) theme = "blue";
    var root = global.document.documentElement;
    if (theme === "dark") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
    var meta = THEME_META[theme];
    var csEl = global.document.querySelector('meta[name="color-scheme"]');
    if (csEl) csEl.setAttribute("content", meta.colorScheme);
    var tcEl = global.document.querySelector('meta[name="theme-color"]');
    if (tcEl) tcEl.setAttribute("content", meta.themeColor);
  }

  function nextTheme(current) {
    var i = THEMES.indexOf(current);
    return THEMES[(i + 1) % THEMES.length];
  }

  function saveTheme(theme) {
    try {
      if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  function odpRenderThemeSwitch(containerId) {
    var el = global.document && global.document.getElementById(containerId);
    if (!el) return;
    var theme = currentTheme();
    el.innerHTML = "";
    el.className = (el.className ? el.className + " " : "") + "odp-theme-switch";
    var btn = global.document.createElement("button");
    btn.type = "button";
    btn.className = "odp-theme-btn";
    btn.setAttribute("aria-label", themeAriaLabel());
    btn.setAttribute("title", themeTitleFor(theme));
    btn.textContent = THEME_META[theme].emoji;
    btn.addEventListener("click", function () {
      var cur = currentTheme();
      var nxt = nextTheme(cur);
      saveTheme(nxt);
      applyTheme(nxt);
      btn.textContent = THEME_META[nxt].emoji;
      btn.setAttribute("aria-label", themeAriaLabel());
      btn.setAttribute("title", themeTitleFor(nxt));
    });
    el.appendChild(btn);
  }

  applyTheme(currentTheme());

  global.odpRenderThemeSwitch = odpRenderThemeSwitch;
  global.odpApplyTheme = applyTheme;
  global.odpCurrentTheme = currentTheme;
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this);
