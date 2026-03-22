require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const path = require("path");

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
        runs: 200,
      },
      viaIR: true,
    },
  },

  networks: {
    // Local development
    hardhat: {},

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
