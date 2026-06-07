/**
 * Loads the WalletConnect bundle (~1.5MB) only when the user chooses mobile / QR connect.
 * Requires odp-wc-config.js (Project ID) earlier in the document.
 */
(function (g) {
  var BUNDLE = "backend/js/odp-wallet-wc.bundle.js?v=20260429wc2";
  g.odpEnsureWalletConnectBundle = function () {
    if (typeof g.odpWalletConnectConnect === "function") return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = BUNDLE;
      s.async = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error("Failed to load WalletConnect script"));
      };
      document.head.appendChild(s);
    });
  };
})(typeof window !== "undefined" ? window : globalThis);
