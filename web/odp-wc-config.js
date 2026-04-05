/**
 * Reown (WalletConnect) Cloud — public Project ID for the browser client.
 * Create a project at https://cloud.reown.com and paste the ID below.
 * This value is not secret; it is embedded in the frontend.
 */
(function (w) {
  if (typeof w.ODP_WALLETCONNECT_PROJECT_ID === "undefined" || w.ODP_WALLETCONNECT_PROJECT_ID === null) {
    w.ODP_WALLETCONNECT_PROJECT_ID = "a1a942c41bfc2af7f0f4d95f3fa7db04";
  }
})(typeof window !== "undefined" ? window : globalThis);
