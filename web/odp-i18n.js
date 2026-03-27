/**
 * ODP UI i18n — loads JSON from localization/<lang>/*.json (canonical copy in repo root: /localization).
 * When the page is served from /web/*.html, resolves ../localization/ so one copy on the server is enough.
 * localStorage odp_locale: "en" | "ru". Add languages under localization/<code>/.
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

  /** Prefer last explicit choice (localStorage), then browser language. */
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
    var wrap = global.document.createElement("div");
    wrap.className = "odp-lang-wrap";
    var sel = global.document.createElement("select");
    sel.className = "odp-lang-select";
    sel.id = "odpLangSelect";
    sel.setAttribute("aria-label", t("lang.switchLabel"));
    sel.setAttribute("title", t("lang.switchLabel"));
    ODP_LOCALES.forEach(function (L) {
      var opt = global.document.createElement("option");
      opt.value = L.code;
      opt.textContent = L.emoji + " " + L.abbr;
      opt.setAttribute("title", L.label);
      if (L.code === loc) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () {
      var v = sel.value;
      if (v && v !== loc) odpSetLocale(v);
    });
    wrap.appendChild(sel);
    el.appendChild(wrap);
  }

  function odpReadmeUrlForLocale(locale) {
    var loc = locale === "ru" ? "ru" : "en";
    if (loc === "ru") {
      return "https://github.com/object-digital-passport/object-digital-passport/blob/main/localization/ru/README.md";
    }
    return "https://github.com/object-digital-passport/object-digital-passport/blob/main/README.md";
  }

  function odpApplyReadmeLinks(root) {
    var doc = root || global.document;
    if (!doc || !doc.querySelectorAll) return;
    var href = odpReadmeUrlForLocale(_locale);
    doc.querySelectorAll("[data-readme-link]").forEach(function (el) {
      el.setAttribute("href", href);
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
      ' <a href="' +
      odpReadmeUrlForLocale(_locale) +
      '" target="_blank" rel="noopener noreferrer" data-readme-link>' +
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

    var i18nPath = "localization/";
    var pathForLog = "";
    try {
      pathForLog = global.location && global.location.pathname ? String(global.location.pathname) : "";
      if (/\/web\/[^/]+\.html?$/i.test(pathForLog)) {
        i18nPath = "../localization/";
      }
    } catch (ePath) {}
    var base = new URL(i18nPath, global.location.href);
    var firstCommonUrl = new URL("en/common.json", base).toString();
    var __i18nRunId = "run-" + Date.now();
    // #region agent log
    fetch('http://127.0.0.1:7597/ingest/4752e168-9e4e-430d-81b2-78d9a49af762',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d72c7'},body:JSON.stringify({sessionId:'7d72c7',runId:__i18nRunId,hypothesisId:'H-B',location:'web/odp-i18n.js:odpInitI18n:base',message:'i18n base resolved',data:{pathname:pathForLog,webPathRegexMatch:/\/web\/[^/]+\.html?$/i.test(pathForLog),href:(global.location&&global.location.href)||'',i18nPath:i18nPath,base:String(base),firstCommonUrl:firstCommonUrl,page:page,locale:_locale},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    return global
      .fetch(firstCommonUrl, { cache: "no-store" })
      .then(function (r) {
        // #region agent log
        fetch('http://127.0.0.1:7597/ingest/4752e168-9e4e-430d-81b2-78d9a49af762',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d72c7'},body:JSON.stringify({sessionId:'7d72c7',runId:__i18nRunId,hypothesisId:'H-A',location:'web/odp-i18n.js:firstCommonFetch',message:'en/common.json response',data:{url:firstCommonUrl,ok:r.ok,status:r.status,pathname:pathForLog},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!r.ok) throw new Error("i18n fetch failed: " + r.status);
        return r.json();
      })
      .then(function (enCommon) {
        return global
          .fetch(new URL("en/" + page + ".json", base).toString(), { cache: "no-store" })
          .then(function (r) {
            if (!r.ok) throw new Error("i18n page fetch failed: " + r.status);
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
            if (!r.ok) throw new Error("ru common fetch failed: " + r.status);
            return r.json();
          })
          .then(function (ruCommon) {
            return global
              .fetch(new URL("ru/" + page + ".json", base).toString(), { cache: "no-store" })
              .then(function (r) {
                if (!r.ok) throw new Error("ru page fetch failed: " + r.status);
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
        odpApplyReadmeLinks(global.document.body);
        // #region agent log
        fetch('http://127.0.0.1:7597/ingest/4752e168-9e4e-430d-81b2-78d9a49af762',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d72c7'},body:JSON.stringify({sessionId:'7d72c7',runId:__i18nRunId,hypothesisId:'H6',location:'web/odp-i18n.js:odpInitI18n:success',message:'i18n loaded successfully',data:{page:page,locale:_locale},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      })
      .catch(function (err) {
        console.warn("[ODP i18n] init failed — language switch uses fallback labels", err);
        // #region agent log
        fetch('http://127.0.0.1:7597/ingest/4752e168-9e4e-430d-81b2-78d9a49af762',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7d72c7'},body:JSON.stringify({sessionId:'7d72c7',runId:__i18nRunId,hypothesisId:'H-E',location:'web/odp-i18n.js:odpInitI18n:failure',message:'i18n load failed; fallback to keys',data:{page:page,locale:_locale,base:String(base),firstCommonUrl:firstCommonUrl,pathname:pathForLog,error:err&&err.message?String(err.message):String(err)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        _merged = { lang: { switchLabel: "Language" } };
        global.odpT = t;
        global.odpGetLocale = function () {
          return _locale;
        };
        global.odpApplyDataI18n = odpApplyDataI18n;
        global.odpRenderLangSwitch = odpRenderLangSwitch;
        global.odpSetLocale = odpSetLocale;
        try {
          odpRenderLangSwitch("odpLangSwitch");
        } catch (eSw) {}
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
