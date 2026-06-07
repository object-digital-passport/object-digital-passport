/**
 * WalletConnect v2 (EIP-1193) for ODP — bundled for static HTML + ethers v5.
 * Build: npm run build:wc (in web/)
 */
import EthereumProvider from "@walletconnect/ethereum-provider";

let wcSingleton = null;

function getProjectId() {
  if (typeof window === "undefined") return "";
  return String(window.ODP_WALLETCONNECT_PROJECT_ID || "").trim();
}

function wcInitOpts(opts) {
  const chainId = opts && opts.chainId != null ? Number(opts.chainId) : 137;
  const rpcUrl =
    (opts && opts.rpcUrl) || "https://polygon-bor.publicnode.com";
  const origin = typeof location !== "undefined" ? location.origin : "";
  const pid = getProjectId();
  return {
    pid,
    chainId,
    rpcUrl,
    origin,
    initPayload: {
      projectId: pid,
      chains: [chainId],
      optionalChains: [chainId],
      rpcMap: { [String(chainId)]: rpcUrl },
      showQrModal: !!(opts && opts.showQrModal),
      metadata: {
        name: "Object Digital Passport",
        description: "ODP — create and verify digital object passports",
        url: origin || "https://",
        icons: origin ? [`${origin}/favicon.ico`] : [],
      },
    },
  };
}

/**
 * Hydrates a persisted WalletConnect session after full page load (no QR).
 * @param {{ chainId?: number, rpcUrl?: string }} [opts]
 * @returns {Promise<import("@walletconnect/ethereum-provider").default | null>}
 */
async function odpWalletConnectTryRestoreSession(opts) {
  const { pid, initPayload } = wcInitOpts({ ...opts, showQrModal: false });
  // #region agent log
  fetch("http://127.0.0.1:7870/ingest/2f5a31df-775f-46ef-a661-30ac4fb319a1", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c94472" },
    body: JSON.stringify({
      sessionId: "c94472",
      location: "odp-wallet-wc.entry.js:odpWalletConnectTryRestoreSession",
      message: "wc restore entry",
      data: { hasPid: !!pid },
      timestamp: Date.now(),
      runId: "wc-persist",
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion
  if (!pid) return null;
  if (wcSingleton && wcSingleton.connected) return wcSingleton;
  if (wcSingleton) {
    try {
      await wcSingleton.disconnect();
    } catch {
      /* ignore */
    }
    wcSingleton = null;
  }

  try {
    const p = await EthereumProvider.init(initPayload);
    let accounts = await p.request({ method: "eth_accounts" }).catch(() => []);
    if ((!accounts || accounts.length === 0) && p.session) {
      try {
        await p.enable();
        accounts = await p.request({ method: "eth_accounts" }).catch(() => []);
      } catch {
        /* session may need user approval on device */
      }
    }
    // #region agent log
    fetch("http://127.0.0.1:7870/ingest/2f5a31df-775f-46ef-a661-30ac4fb319a1", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c94472" },
      body: JSON.stringify({
        sessionId: "c94472",
        location: "odp-wallet-wc.entry.js:odpWalletConnectTryRestoreSession",
        message: "wc after init accounts",
        data: { accountCount: accounts && accounts.length, hasSession: !!p.session },
        timestamp: Date.now(),
        runId: "wc-persist",
        hypothesisId: "H1",
      }),
    }).catch(() => {});
    // #endregion
    if (accounts && accounts.length > 0) {
      wcSingleton = p;
      return p;
    }
    try {
      await p.disconnect();
    } catch {
      /* ignore */
    }
    wcSingleton = null;
    return null;
  } catch (e) {
    wcSingleton = null;
    return null;
  }
}

/**
 * @param {{ chainId?: number, rpcUrl?: string }} [opts]
 * @returns {Promise<import("@walletconnect/ethereum-provider").default>}
 */
async function odpWalletConnectConnect(opts) {
  const { pid, initPayload } = wcInitOpts({ ...opts, showQrModal: true });
  if (!pid) {
    throw new Error(
      "WalletConnect is not configured: set ODP_WALLETCONNECT_PROJECT_ID in odp-wc-config.js (get a free Project ID at https://cloud.reown.com)."
    );
  }

  if (wcSingleton && wcSingleton.connected) {
    return wcSingleton;
  }
  if (wcSingleton) {
    let acc = await wcSingleton.request({ method: "eth_accounts" }).catch(() => []);
    if (acc && acc.length > 0) return wcSingleton;
    try {
      await wcSingleton.disconnect();
    } catch {
      /* ignore */
    }
    wcSingleton = null;
  }

  const origin = typeof location !== "undefined" ? location.origin : "";
  wcSingleton = await EthereumProvider.init({
    projectId: pid,
    chains: initPayload.chains,
    optionalChains: initPayload.optionalChains,
    rpcMap: initPayload.rpcMap,
    showQrModal: true,
    metadata: {
      name: "Object Digital Passport",
      description: "ODP — create and verify digital object passports",
      url: origin || "https://",
      icons: origin ? [`${origin}/favicon.ico`] : [],
    },
  });

  await wcSingleton.connect();
  return wcSingleton;
}

async function odpWalletConnectDisconnect() {
  if (!wcSingleton) return;
  try {
    await wcSingleton.disconnect();
  } catch {
    /* ignore */
  }
  wcSingleton = null;
}

function odpWalletConnectIsActive() {
  return !!(wcSingleton && wcSingleton.connected);
}

function odpWalletConnectGetEip1193() {
  return wcSingleton;
}

const g = typeof window !== "undefined" ? window : globalThis;
g.odpWalletConnectTryRestoreSession = odpWalletConnectTryRestoreSession;
g.odpWalletConnectConnect = odpWalletConnectConnect;
g.odpWalletConnectDisconnect = odpWalletConnectDisconnect;
g.odpWalletConnectIsActive = odpWalletConnectIsActive;
g.odpWalletConnectGetEip1193 = odpWalletConnectGetEip1193;
