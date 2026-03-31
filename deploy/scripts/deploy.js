/**
 * Object Digital Passport — Deploy Script
 * Author: Andrei Chernikov
 * Hardhat + ethers.js
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network amoy     ← testnet (free)
 *   npx hardhat run scripts/deploy.js --network polygon  ← mainnet
 *
 * After deploy:
 *   1. Copy contract address into web/creator.html, web/passport.html, web/verify.html
 *   2. Copy ABI from artifacts/ into tools/abi.json
 *   3. Upload passport.json files to your dataUrl
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("\n  Object Digital Passport — Deploy");
  console.log("  ─────────────────────────────────────────");
  console.log(`  Network:  ${network.name} (chain ID ${network.chainId})`);
  console.log(`  Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:  ${ethers.formatEther(balance)} POL`);
  console.log();

  // ── Deploy (library first — EIP-170 bytecode split) ─────────────────────────
  console.log("  Deploying ODPPassportLib...");
  const LibFactory = await ethers.getContractFactory("ODPPassportLib");
  const passportLib = await LibFactory.deploy();
  await passportLib.waitForDeployment();
  const passportLibAddress = await passportLib.getAddress();
  console.log(`  ✅ ODPPassportLib: ${passportLibAddress}`);

  console.log("  Deploying ObjectDigitalPassport (linked)...");
  const Factory = await ethers.getContractFactory("ObjectDigitalPassport", {
    libraries: {
      "contracts/ODPPassportLib.sol:ODPPassportLib": passportLibAddress,
    },
  });
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`  ✅ Deployed: ${address}`);

  let walletDocumentAnchorAddress = null;
  try {
    console.log("\n  Deploying ODPWalletDocumentAnchor (optional satellite for file SHA-256 anchors)...");
    const AnchorFactory = await ethers.getContractFactory("ODPWalletDocumentAnchor");
    const anchor = await AnchorFactory.deploy(address);
    await anchor.waitForDeployment();
    walletDocumentAnchorAddress = await anchor.getAddress();
    console.log(`  ✅ Wallet document anchor: ${walletDocumentAnchorAddress}`);
    console.log(`     Set NET.docAnchor in verify.html to this address for v0.3+ on-chain file attest.`);
  } catch (e) {
    console.log(`  ⚠️  ODPWalletDocumentAnchor deploy skipped: ${e && e.message ? e.message : e}`);
  }

  let counterfeitConcernAddress = null;
  try {
    console.log("\n  Deploying ODPCounterfeitConcern (satellite: P/M institutional authenticity concern)...");
    const CfFactory = await ethers.getContractFactory("ODPCounterfeitConcern");
    const cf = await CfFactory.deploy(address);
    await cf.waitForDeployment();
    counterfeitConcernAddress = await cf.getAddress();
    console.log(`  ✅ Counterfeit concern satellite: ${counterfeitConcernAddress}`);
    console.log(`     Set NET.counterfeitConcern in verify.html / passport.html to this address (paired with this registry).`);
  } catch (e) {
    console.log(`  ⚠️  ODPCounterfeitConcern deploy skipped: ${e && e.message ? e.message : e}`);
  }

  const deployedVersion = await contract.CONTRACT_VERSION();
  const dv = BigInt(deployedVersion.toString());
  const specMajor = dv / 16n;
  const specMinor = dv % 16n;
  console.log(`  SPEC_MAJOR: ${specMajor}  SPEC_MINOR: ${specMinor}  CONTRACT_VERSION (packed): ${deployedVersion}`);

  // ── Smoke test (testnet only) ──────────────────────────────────────────────
  if (network.chainId === 80002n) {
    console.log("\n  Running smoke test on testnet...");

    console.log(`  Packed byte: ${deployedVersion} (v0.3 = 3: ownership, revocation, extra image hashes, P-affiliation detach)`);

    // 1. Register as Creator type C (bytes1 "C" = 0x43)
    console.log("\n  1. Registering profile (type C)...");
    const regTx = await contract.registerCreator(
      ethers.hexlify(ethers.toUtf8Bytes("C")) // bytes1 "C"
    );
    const regReceipt = await regTx.wait();
    const creatorId = await contract.getCreatorByWallet(deployer.address);
    console.log(`     ✅ Profile ID: ${creatorId}`);

    // 2. Mint a digital passport (no seal required)
    console.log("\n  2. Minting digital passport...");
    const fakeDataHash  = ethers.keccak256(ethers.toUtf8Bytes("test-passport-json"));
    const fakeFileHash  = ethers.keccak256(ethers.toUtf8Bytes("test-original-file"));
    const fakeImageHash = ethers.keccak256(ethers.toUtf8Bytes("test-preview-image"));
    const now = new Date();

    const z = ethers.ZeroHash;
    const mintTx = await contract.mintDigital(
      now.getFullYear(),                  // year (uint32)
      now.getMonth() + 1,                 // month (uint8)
      fakeDataHash,                       // dataHash (bytes32)
      "https://example.com/passport.json",// dataUrl
      fakeImageHash,                      // imageHash (bytes32)
      "https://example.com/preview.jpg",  // imageUrl
      z,                                  // imageHash2 (v0.3)
      "",                                 // imageUrl2
      z,                                  // imageHash3
      "",                                 // imageUrl3
      fakeFileHash,                       // fileHash (bytes32) — required for digital
      false,                              // dataUrlIsFolderBase — full URL, not folder root
      z,                                  // auxCommitmentHash
      "",                                 // auxCommitmentUri
      ""                                  // mintOnBehalfOfCreatorId (self-mint)
    );
    const mintReceipt = await mintTx.wait();

    // Parse humanId from PassportMinted event
    let humanId = null;
    for (const log of mintReceipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed.name === "PassportMinted") {
          humanId = parsed.args.humanId;
          break;
        }
      } catch {}
    }
    console.log(`     ✅ Passport ID: ${humanId}`);

    // 3. Verify getPassport + getCreator + proofs (resolvePassport removed from bytecode in v0.3)
    console.log("\n  3. Resolving passport (multi-call)...");
    const passport = await contract.getPassport(humanId);
    const creator = await contract.getCreator(passport.creatorId);
    const proofIds = await contract.getProofsForPassport(humanId);
    const proofCount = proofIds.length;
    const version = await contract.CONTRACT_VERSION();
    console.log(`     ✅ contractVersion: ${version}`);
    console.log(`     ✅ objectType:      ${passport.objectType}`);
    console.log(`     ✅ creatorId:       ${passport.creatorId}`);
    console.log(`     ✅ proofCount:      ${proofCount}`);

    // 4. Check remaining mints
    const remaining = await contract.getRemainingMints(deployer.address);
    console.log(`\n  4. Remaining mints this month: ${remaining}`);

    console.log("\n  ✅ Smoke test passed");
  }

  // ── Save deployment info ───────────────────────────────────────────────────
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const networkName = network.chainId === 80002n ? "amoy" : "polygon";
  const deploymentPath = path.join(deploymentsDir, `${networkName}.json`);

  const deployment = {
    network:                  networkName,
    chainId:                  Number(network.chainId),
    passportLibAddress:       passportLibAddress,
    contractAddress:          address,
    walletDocumentAnchorAddress,
    contractVersion:  Number(deployedVersion),
    deployedBy:       deployer.address,
    deployedAt:       new Date().toISOString(),
    txHash:           contract.deploymentTransaction()?.hash || null,
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`\n  ✅ Saved: deployments/${networkName}.json`);

  // ── Also save ABI for use in tools/ and web/ ──────────────────────────────
  const artifactPath = path.join(
    __dirname, "..", "..", "artifacts", "contracts",
    "ObjectDigitalPassport.sol", "ObjectDigitalPassport.json"
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiPath  = path.join(deploymentsDir, "abi.json");
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`  ✅ Saved: deployments/abi.json`);
    console.log(`\n  📋 Copy contract address to web/creator.html, web/passport.html, web/verify.html`);
    console.log(`     Look for: contract: "",  // ← paste after deploy`);
  }

  console.log("\n  ─────────────────────────────────────────");
  console.log(`  Contract: ${address}`);
  const explorer = network.chainId === 80002n
    ? `https://amoy.polygonscan.com/address/${address}`
    : `https://polygonscan.com/address/${address}`;
  console.log(`  Explorer: ${explorer}`);
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
