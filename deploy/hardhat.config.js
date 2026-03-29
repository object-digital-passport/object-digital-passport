require("@nomicfoundation/hardhat-toolbox");
const fs = require("fs");
const path = require("path");
const { task } = require("hardhat/config");

// deploy/.env then deploy/user-setup/private.local.env (override) — see deploy/user-setup/README.md
require("dotenv").config({ path: path.join(__dirname, ".env") });
const userSetupEnvPath = path.join(__dirname, "user-setup", "private.local.env");
require("dotenv").config({
  path: userSetupEnvPath,
  override: true,
});

const PRIVATE_KEY = (process.env.PRIVATE_KEY || "").trim();
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
// Use ODP_* so a broken POLYGON_RPC_URL from ~/.zshrc (dead Alchemy) does not override.
const POLYGON_RPC_URL =
  process.env.ODP_POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com";
const AMOY_RPC_URL =
  process.env.ODP_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";

if (!PRIVATE_KEY) {
  const exists = fs.existsSync(userSetupEnvPath);
  console.warn(
    exists
      ? `WARNING: PRIVATE_KEY missing or empty in ${userSetupEnvPath} (one line: PRIVATE_KEY=64hex without 0x). Do not put secrets in private.local.env.example.`
      : `WARNING: PRIVATE_KEY not set — copy deploy/user-setup/private.local.env.example to deploy/user-setup/private.local.env and fill PRIVATE_KEY (see deploy/user-setup/README.md).`
  );
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  paths: {
    root: path.join(__dirname, ".."),
    // Tests live under `deploy/test/` (default would be repo-root `test/`)
    tests: "deploy/test",
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        // Lower runs shrink bytecode — v0.3 contract is large (Spurious Dragon 24 KiB deploy limit).
        runs: 1,
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "none",
      },
    },
  },

  networks: {
    // Local development — ObjectDigitalPassport v0.3+ is near EIP-170 limit; tests need this until bytecode is split or trimmed.
    hardhat: {
      allowUnlimitedContractSize: true,
    },

    // Polygon Amoy — testnet (free, faucet available)
    amoy: {
      url: AMOY_RPC_URL,
      chainId: 80002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },

    // Polygon PoS — mainnet (~$0.01 per mint)
    polygon: {
      url: POLYGON_RPC_URL,
      chainId: 137,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },

  // For contract verification on Polygonscan (optional)
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      polygonAmoy: POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
};

// EIP-170 size report (main registry + linked ODPPassportLib).
task("compile", async (taskArgs, hre, runSuper) => {
  await runSuper(taskArgs);
  const limit = 24576;
  const doc = path.join(hre.config.paths.root, "docs", "EIP170_STRATEGY.md");
  try {
    const main = await hre.artifacts.readArtifact("ObjectDigitalPassport");
    const mainBytes = (main.deployedBytecode.length - 2) / 2;
    let libBytes = 0;
    try {
      const lib = await hre.artifacts.readArtifact("ODPPassportLib");
      libBytes = (lib.deployedBytecode.length - 2) / 2;
    } catch {
      /* no lib */
    }
    const libNote = libBytes ? `  ODPPassportLib: ${libBytes} bytes (deploy separately, then link).` : "";
    if (mainBytes > limit) {
      console.log(
        `\n[ODP] EIP-170: ObjectDigitalPassport = ${mainBytes} bytes (limit ${limit}, over by ${mainBytes - limit}).${libNote ? `\n${libNote}` : ""}\n` +
          `  Mitigations: ${doc}\n`
      );
    } else {
      console.log(
        `\n[ODP] EIP-170: ObjectDigitalPassport = ${mainBytes} bytes (within ${limit} limit).${libNote ? `\n${libNote}` : ""}\n`
      );
    }
  } catch {
    // renamed / not in project
  }
});
