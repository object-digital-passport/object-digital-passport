import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const deployDir = path.join(__dirname, "deploy");
dotenv.config({ path: path.join(deployDir, ".env") });
const userSetupEnvPath = path.join(deployDir, "user-setup", "private.local.env");
dotenv.config({ path: userSetupEnvPath, override: true });

const PRIVATE_KEY = (process.env.PRIVATE_KEY || "").trim();
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const POLYGON_RPC_URL =
  process.env.ODP_POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com";
const AMOY_RPC_URL =
  process.env.ODP_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";

if (!PRIVATE_KEY) {
  const exists = fs.existsSync(userSetupEnvPath);
  console.warn(
    exists
      ? `WARNING: PRIVATE_KEY missing or empty in ${userSetupEnvPath} (one line: PRIVATE_KEY=64hex without 0x). Do not put secrets in private.local.env.example.`
      : `WARNING: PRIVATE_KEY not set — copy deploy/user-setup/private.local.env.example to deploy/user-setup/private.local.env and fill PRIVATE_KEY (see deploy/user-setup/README.md).`,
  );
}

export default defineConfig({
  paths: {
    sources: "contracts",
    tests: {
      mocha: "deploy/test",
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "none",
      },
    },
  },

  networks: {
    // Hardhat 3 default test network is `default`, not `hardhat`.
    default: {
      type: "edr-simulated",
      allowUnlimitedContractSize: true,
    },
    amoy: {
      type: "http",
      url: AMOY_RPC_URL,
      chainId: 80002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    polygon: {
      type: "http",
      url: POLYGON_RPC_URL,
      chainId: 137,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },

  verify: {
    etherscan: {
      apiKey: POLYGONSCAN_API_KEY,
    },
  },

  chainDescriptors: {
    80002: {
      name: "polygon-amoy",
      blockExplorers: {
        etherscan: {
          name: "PolygonScan",
          url: "https://amoy.polygonscan.com",
          apiUrl: "https://api-amoy.polygonscan.com/api",
        },
      },
    },
    137: {
      name: "polygon-mainnet",
      blockExplorers: {
        etherscan: {
          name: "PolygonScan",
          url: "https://polygonscan.com",
          apiUrl: "https://api.polygonscan.com/api",
        },
      },
    },
  },
});
