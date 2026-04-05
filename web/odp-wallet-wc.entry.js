/**
 * WalletConnect v2 (EIP-1193) for ODP — bundled for static HTML + ethers v5.
 * Build: npx esbuild odp-wallet-wc.entry.js --bundle --format=iife --platform=browser --outfile=odp-wallet-wc.bundle.js
 */
import EthereumProvider from "@walletconnect/ethereum-provider";

let wcSingleton = null;

function getProjectId() {
  if (typeof window === "undefined") return "";
  return String(window.ODP_WALLETCONNECT_PROJECT_ID || "").trim();
}

/**
 * @param {{ chainId?: number, rpcUrl?: string }} [opts]
 * @returns {Promise<import("@walletconnect/ethereum-provider").default>}
 */
async function odpWalletConnectConnect(opts) {
  const pid = getProjectId();
  if (!pid) {
    throw new Error(
      "WalletConnect is not configured: set ODP_WALLETCONNECT_PROJECT_ID in odp-wc-config.js (get a free Project ID at https://cloud.reown.com)."
    );
  }
  const chainId = opts && opts.chainId != null ? Number(opts.chainId) : 137;
  const rpcUrl =
    (opts && opts.rpcUrl) || "https://polygon-bor.publicnode.com";

  if (wcSingleton && wcSingleton.connected) {
    return wcSingleton;
  }
  if (wcSingleton) {
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
    chains: [chainId],
    optionalChains: [chainId],
    rpcMap: { [String(chainId)]: rpcUrl },
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
g.odpWalletConnectConnect = odpWalletConnectConnect;
g.odpWalletConnectDisconnect = odpWalletConnectDisconnect;
g.odpWalletConnectIsActive = odpWalletConnectIsActive;
g.odpWalletConnectGetEip1193 = odpWalletConnectGetEip1193;
