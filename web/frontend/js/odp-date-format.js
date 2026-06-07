/**
 * ODP UI date formats: DD.MM.YYYY (and optional local / UTC time).
 */
(function (g) {
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function odpFormatDateDDMMYYYY(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
    return pad2(d.getDate()) + "." + pad2(d.getMonth() + 1) + "." + d.getFullYear();
  }

  /** Local: DD.MM.YYYY, HH:MM:SS */
  function odpFormatDateTimeLocalDDMMYYYY(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
    return (
      pad2(d.getDate()) +
      "." +
      pad2(d.getMonth() + 1) +
      "." +
      d.getFullYear() +
      ", " +
      pad2(d.getHours()) +
      ":" +
      pad2(d.getMinutes()) +
      ":" +
      pad2(d.getSeconds())
    );
  }

  /** UTC: DD.MM.YYYY, HH:MM:SS UTC */
  function odpFormatDateTimeUtcDDMMYYYY(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
    return (
      pad2(d.getUTCDate()) +
      "." +
      pad2(d.getUTCMonth() + 1) +
      "." +
      d.getUTCFullYear() +
      ", " +
      pad2(d.getUTCHours()) +
      ":" +
      pad2(d.getUTCMinutes()) +
      ":" +
      pad2(d.getUTCSeconds()) +
      " UTC"
    );
  }

  /** YYYY-MM-DD → DD.MM.YYYY; already DD.MM.YYYY unchanged. */
  function odpFormatDateStringForDisplay(s) {
    const raw = String(s == null ? "" : s).trim();
    if (!raw) return "";
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (iso) return iso[3] + "." + iso[2] + "." + iso[1];
    return raw;
  }

  g.odpFormatDateDDMMYYYY = odpFormatDateDDMMYYYY;
  g.odpFormatDateTimeLocalDDMMYYYY = odpFormatDateTimeLocalDDMMYYYY;
  g.odpFormatDateTimeUtcDDMMYYYY = odpFormatDateTimeUtcDDMMYYYY;
  g.odpFormatDateStringForDisplay = odpFormatDateStringForDisplay;
})(typeof globalThis !== "undefined" ? globalThis : window);
