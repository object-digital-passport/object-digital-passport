require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const path = require("path");
const { task } = require("hardhat/config");

// Load from .env file — never commit private keys to git
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

if (!PRIVATE_KEY) {
  console.warn("WARNING: PRIVATE_KEY not set in .env — deploy will fail");
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
      url: "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },

    // Polygon PoS — mainnet (~$0.01 per mint)
    polygon: {
      url: "https://polygon-rpc.com",
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
