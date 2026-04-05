/**
 * Shared “physical ID card” markup + QR mount for odp:// URIs (profile / passport).
 * Depends on qrcodejs + page-defined renderOdpQr(el, text, fallback, pixelSize).
 */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Last numeric segment of an ODP ID, or trailing digits (optional helpers). */
  function odpIdCardNumericTail(id) {
    var parts = String(id || "")
      .split("-")
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
    var last = parts.length ? parts[parts.length - 1] : "";
    if (/^\d+$/.test(last)) return last;
    var digits = String(id || "").replace(/\D/g, "");
    return digits.length ? digits.slice(-6) : "—";
  }

  /**
   * @param {object} o
   * @param {string} o.qrSlotId
   * @param {string} o.brandLabel
   * @param {string} o.stampText
   * @param {string} o.heroTitle - serif anchor (e.g. Object Digital Passport)
   * @param {string} o.heroId - profile ID (mono, secondary)
   * @param {string} o.accountTypeLabel - full type name (Creator, Brand, …)
   * @param {string} o.qrHint - optional caption under QR
   * @param {string} o.srLabel
   */
  function odpProfileIdCardHtml(o) {
    var qrId = esc(o.qrSlotId || "odpIdCardQrProfile");
    var hint =
      o.qrHint && String(o.qrHint).trim()
        ? '<p class="odp-id-card__qr-hint">' + esc(o.qrHint) + "</p>"
        : "";
    var rootId = o.cardRootId;
    var rootOpen =
      rootId === false || rootId === ""
        ? '<div class="odp-id-card-page-wrap"'
        : '<div id="' + esc(rootId != null ? String(rootId) : "odpProfileCardExport") + '" class="odp-id-card-page-wrap"';
    return (
      rootOpen +
      ' role="region" aria-label="' +
      esc(o.srLabel || "Profile ID card") +
      '">' +
      '<div class="odp-id-card__shell">' +
      '<article class="odp-id-card">' +
      '<div class="odp-id-card__body">' +
      '<div class="odp-id-card__brand-row">' +
      '<span class="odp-id-card__brand">' +
      esc(o.brandLabel) +
      "</span>" +
      '<div class="odp-id-card__stamp" aria-hidden="true">' +
      esc(o.stampText || "ODP") +
      "</div>" +
      "</div>" +
      '<p class="odp-id-card__hero-title">' +
      esc(o.heroTitle || "") +
      "</p>" +
      '<p class="odp-id-card__id-line">' +
      esc(o.heroId) +
      "</p>" +
      '<div class="odp-id-card__badges">' +
      '<span class="odp-id-card__pill">' +
      esc(o.accountTypeLabel || "—") +
      "</span>" +
      "</div>" +
      '<div class="odp-id-card__rule" role="separator"></div>' +
      '<div class="odp-id-card__bottom odp-id-card__bottom--qr-only">' +
      '<div class="odp-id-card__qr-stack">' +
      '<div class="odp-id-card__qr" id="' +
      qrId +
      '"></div>' +
      hint +
      "</div>" +
      "</div>" +
      '<p class="odp-id-card__sr-only">' +
      esc(o.srLabel || "") +
      "</p>" +
      "</div>" +
      "</article>" +
      "</div>" +
      "</div>"
    );
  }

  /**
   * @param {object} o
   * @param {string} o.title - optional object title (shown small above ODP id when different from humanId)
   * @param {string} o.humanId - ODP passport id (large hero, one line)
   * @param {string} [o.creatorProfileId] - creator profile id (mono accent line under ODP id)
   * @param {string} o.qrSlotId
   * @param {string} o.stampText
   * @param {string} o.badgePrimary - physical / digital label
   * @param {string} o.brandLine - top mono label (i18n)
   * @param {string} o.qrHint - optional caption under QR
   * @param {string} o.srLabel
   */
  function odpPassportIdCardHtml(o) {
    var qrId = esc(o.qrSlotId || "odpIdCardQrPassport");
    var tit = o.title && String(o.title).trim();
    var hid = o.humanId && String(o.humanId).trim();
    var cid = o.creatorProfileId != null ? String(o.creatorProfileId).trim() : "";
    var subtitleBlock =
      tit && hid && tit !== hid
        ? '<p class="odp-id-card__object-subtitle">' + esc(tit) + "</p>"
        : "";
    var hint =
      o.qrHint && String(o.qrHint).trim()
        ? '<p class="odp-id-card__qr-hint">' + esc(o.qrHint) + "</p>"
        : "";
    var rootId = o.cardRootId;
    var rootOpen =
      rootId === false || rootId === ""
        ? '<div class="odp-id-card-page-wrap"'
        : '<div id="' + esc(rootId != null ? String(rootId) : "odpPassportCardExport") + '" class="odp-id-card-page-wrap"';
    return (
      rootOpen +
      ' role="region" aria-label="' +
      esc(o.srLabel || "Passport ID card") +
      '">' +
      '<div class="odp-id-card__shell">' +
      '<article class="odp-id-card">' +
      '<div class="odp-id-card__body">' +
      '<div class="odp-id-card__brand-row">' +
      '<span class="odp-id-card__brand">' +
      esc(o.brandLine || "PASSPORT") +
      "</span>" +
      '<div class="odp-id-card__stamp" aria-hidden="true">' +
      esc(o.stampText || "ODP") +
      "</div>" +
      "</div>" +
      subtitleBlock +
      '<h2 class="odp-id-card__hero odp-id-card__hero--serif odp-id-card__hero--passport-id">' +
      esc(hid || "") +
      "</h2>" +
      '<p class="odp-id-card__id-line odp-id-card__id-line--accent">' +
      esc(cid || "\u2014") +
      "</p>" +
      '<div class="odp-id-card__badges">' +
      '<span class="odp-id-card__pill">' +
      esc(o.badgePrimary || "") +
      "</span>" +
      "</div>" +
      '<div class="odp-id-card__rule" role="separator"></div>' +
      '<div class="odp-id-card__bottom odp-id-card__bottom--qr-only">' +
      '<div class="odp-id-card__qr-stack">' +
      '<div class="odp-id-card__qr" id="' +
      qrId +
      '"></div>' +
      hint +
      "</div>" +
      "</div>" +
      '<p class="odp-id-card__sr-only">' +
      esc(o.srLabel || "") +
      "</p>" +
      "</div>" +
      "</article>" +
      "</div>" +
      "</div>"
    );
  }

  /**
   * @param {string|HTMLElement} elOrId
   * @param {string} uri - odp://…
   * @param {function(HTMLElement,string,string,number?)} [renderQr] - defaults to global.renderOdpQr
   * @param {number} [pixelSize] - QR module size (default 108)
   */
  function mountOdpIdCardQr(elOrId, uri, renderQr, pixelSize) {
    var el =
      typeof elOrId === "string" ? global.document && global.document.getElementById(elOrId) : elOrId;
    var fn = typeof renderQr === "function" ? renderQr : global.renderOdpQr;
    if (!el || typeof fn !== "function" || !uri) return;
    var size = pixelSize != null && pixelSize > 0 ? Math.round(pixelSize) : 108;
    fn(el, uri, uri, size);
  }

  global.odpIdCardNumericTail = odpIdCardNumericTail;
  global.odpProfileIdCardHtml = odpProfileIdCardHtml;
  global.odpPassportIdCardHtml = odpPassportIdCardHtml;
  global.mountOdpIdCardQr = mountOdpIdCardQr;
})(typeof window !== "undefined" ? window : this);
