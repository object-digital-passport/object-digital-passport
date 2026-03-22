/**
 * ODP UI i18n — loads JSON from i18n/<lang>/*.json (canonical copy in repo root: /i18n).
 * When the page is served from /web/*.html, resolves ../i18n/ so one copy on the server is enough.
 * localStorage odp_locale: "en" | "ru". Add languages under i18n/<code>/.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "odp_locale";
  var ODP_LOCALES = [
    { code: "en", emoji: "🇬🇧", abbr: "EN", label: "English" },
    { code: "ru", emoji: "🇷🇺", abbr: "RU", label: "Русский" },
  ];

  var _locale = "en";
  var _merged = {};

  function deepMerge(target, source) {
    if (!source) return target || {};
    var out = {};
    var k;
    for (k in target) out[k] = target[k];
    for (k in source) {
      if (
        source[k] &&
        typeof source[k] === "object" &&
        !Array.isArray(source[k]) &&
        out[k] &&
        typeof out[k] === "object" &&
        !Array.isArray(out[k])
      ) {
        out[k] = deepMerge(out[k], source[k]);
      } else if (source[k] !== undefined && source[k] !== null && source[k] !== "") {
        out[k] = source[k];
      }
    }
    return out;
  }

  function odpResolveLocale() {
    try {
      var s = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (s === "en" || s === "ru") return s;
    } catch (e0) {}
    var nav = (global.navigator && global.navigator.language) || "en";
    nav = String(nav).toLowerCase();
    if (nav.startsWith("ru")) return "ru";
    return "en";
  }

  function t(key) {
    var parts = String(key).split(".");
    var cur = _merged;
    for (var i = 0; i < parts.length; i++) {
      cur = cur && cur[parts[i]];
    }
    return typeof cur === "string" ? cur : key;
  }

  function odpApplyDataI18n(root) {
    var doc = root || global.document;
    if (!doc || !doc.querySelectorAll) return;
    doc.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (!k) return;
      var v = t(k);
      if (v !== k) el.textContent = v;
    });
    doc.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-title");
      if (!k) return;
      var v = t(k);
      if (v !== k) el.setAttribute("title", v);
    });
    doc.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-placeholder");
      if (!k) return;
      var v = t(k);
      if (v !== k) el.setAttribute("placeholder", v);
    });
    doc.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-aria");
      if (!k) return;
      var v = t(k);
      if (v !== k) el.setAttribute("aria-label", v);
    });
  }

  function odpSetLocale(code) {
    try {
      if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, code);
    } catch (e1) {}
    global.location.reload();
  }

  function odpRenderLangSwitch(containerId) {
    var el = global.document && global.document.getElementById(containerId);
    if (!el) return;
    var loc = _locale;
    el.innerHTML = "";
    el.className = (el.className ? el.className + " " : "") + "odp-lang-switch";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", t("lang.switchLabel"));
    ODP_LOCALES.forEach(function (L) {
      var b = global.document.createElement("button");
      b.type = "button";
      b.className = "odp-lang-btn" + (L.code === loc ? " is-active" : "");
      b.setAttribute("aria-pressed", L.code === loc ? "true" : "false");
      b.setAttribute("title", L.label);
      b.innerHTML =
        '<span class="odp-lang-emoji" aria-hidden="true">' +
        L.emoji +
        '</span><span class="odp-lang-abbr">' +
        L.abbr +
        "</span>";
      (function (code, active) {
        b.onclick = function () {
          if (code !== active) odpSetLocale(code);
        };
      })(L.code, loc);
      el.appendChild(b);
    });
  }

  /** Registry banner HTML (replaces odpRegistryMisconfiguredBannerHtml when i18n loaded). */
  function odpRegistryBannerHtml(isLocal) {
    if (isLocal) {
      return '<div class="info neutral" style="line-height:1.55">' + t("registry.hintLocal") + "</div>";
    }
    return (
      '<div class="info neutral" style="line-height:1.55">' +
      t("registry.hintProduction") +
      ' <a href="https://github.com/object-digital-passport/object-digital-passport/blob/main/README.md" target="_blank" rel="noopener noreferrer">' +
      t("registry.readmeLink") +
      "</a></div>"
    );
  }

  /**
   * @param {{ page: string, pageTitleKey?: string }} opts
   * page: creator | passport | verify | index
   */
  function odpInitI18n(opts) {
    opts = opts || {};
    var page = opts.page || "index";
    _locale = odpResolveLocale();

    if (typeof global.location === "undefined" || !global.location.href) {
      _merged = {};
      global.odpT = t;
      global.odpGetLocale = function () {
        return _locale;
      };
      global.odpRegistryBannerHtml = odpRegistryBannerHtml;
      return Promise.resolve();
    }

    var i18nPath = "i18n/";
    try {
      var pathname = global.location && global.location.pathname ? String(global.location.pathname) : "";
      if (/\/web\/[^/]+\.html?$/i.test(pathname)) {
        i18nPath = "../i18n/";
      }
    } catch (ePath) {}
    var base = new URL(i18nPath, global.location.href);

    return global
      .fetch(new URL("en/common.json", base).toString(), { cache: "no-store" })
      .then(function (r) {
        return r.json();
      })
      .then(function (enCommon) {
        return global
          .fetch(new URL("en/" + page + ".json", base).toString(), { cache: "no-store" })
          .then(function (r) {
            return r.json();
          })
          .then(function (enPage) {
            return deepMerge(enCommon, enPage);
          });
      })
      .then(function (enAll) {
        if (_locale === "en") {
          _merged = enAll;
          return Promise.resolve();
        }
        return global
          .fetch(new URL("ru/common.json", base).toString(), { cache: "no-store" })
          .then(function (r) {
            return r.json();
          })
          .then(function (ruCommon) {
            return global
              .fetch(new URL("ru/" + page + ".json", base).toString(), { cache: "no-store" })
              .then(function (r) {
                return r.json();
              })
              .then(function (ruPage) {
                return deepMerge(ruCommon, ruPage);
              });
          })
          .then(function (ruAll) {
            _merged = deepMerge(enAll, ruAll);
          });
      })
      .then(function () {
        global.document.documentElement.lang = _locale === "ru" ? "ru" : "en";
        global.odpT = t;
        global.odpGetLocale = function () {
          return _locale;
        };
        global.odpRegistryBannerHtml = odpRegistryBannerHtml;
        global.odpApplyDataI18n = odpApplyDataI18n;
        global.odpRenderLangSwitch = odpRenderLangSwitch;
        global.odpSetLocale = odpSetLocale;
        global.odpRegistryMisconfiguredBannerHtml = function (isLocal) {
          return odpRegistryBannerHtml(isLocal);
        };
        if (opts.pageTitleKey) {
          try {
            global.document.title = t(opts.pageTitleKey);
          } catch (e2) {}
        }
        odpRenderLangSwitch("odpLangSwitch");
        odpApplyDataI18n(global.document.body);
      })
      .catch(function () {
        _merged = {};
        global.odpT = t;
        global.odpGetLocale = function () {
          return _locale;
        };
      });
  }

  global.odpInitI18n = odpInitI18n;
  global.odpT = function (k) {
    return k;
  };
  global.odpGetLocale = function () {
    return odpResolveLocale();
  };
  global.ODP_I18N_LOCALES = ODP_LOCALES;
})(typeof window !== "undefined" ? window : globalThis);
