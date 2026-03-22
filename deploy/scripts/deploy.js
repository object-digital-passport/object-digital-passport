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

  // ── Deploy ─────────────────────────────────────────────────────────────────
  console.log("  Deploying ObjectDigitalPassport...");
  const Factory = await ethers.getContractFactory("ObjectDigitalPassport");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`  ✅ Deployed: ${address}`);
  const deployedVersion = await contract.CONTRACT_VERSION();
  const specMajor = await contract.SPEC_MAJOR();
  const specMinor = await contract.SPEC_MINOR();
  console.log(`  SPEC_MAJOR: ${specMajor}  SPEC_MINOR: ${specMinor}  CONTRACT_VERSION (packed): ${deployedVersion}`);

  // ── Smoke test (testnet only) ──────────────────────────────────────────────
  if (network.chainId === 80002n) {
    console.log("\n  Running smoke test on testnet...");

    console.log(`  Packed byte: ${deployedVersion} (v0.2 = 2: M prefix, unlimited P/M, proofs P/M, optional dataUrl, external docs)`);

    // 1. Register as Creator type C (bytes1 "C" = 0x43)
    console.log("\n  1. Registering Creator ID (type C)...");
    const regTx = await contract.registerCreator(
      ethers.hexlify(ethers.toUtf8Bytes("C")) // bytes1 "C"
    );
    const regReceipt = await regTx.wait();
    const creatorId = await contract.getCreatorByWallet(deployer.address);
    console.log(`     ✅ Creator ID: ${creatorId}`);

    // 2. Mint a digital passport (no seal required)
    console.log("\n  2. Minting digital passport...");
    const fakeDataHash  = ethers.keccak256(ethers.toUtf8Bytes("test-passport-json"));
    const fakeFileHash  = ethers.keccak256(ethers.toUtf8Bytes("test-original-file"));
    const fakeImageHash = ethers.keccak256(ethers.toUtf8Bytes("test-preview-image"));
    const now = new Date();

    const mintTx = await contract.mintDigital(
      now.getFullYear(),                  // year (uint32)
      now.getMonth() + 1,                 // month (uint8)
      fakeDataHash,                       // dataHash (bytes32)
      "https://example.com/passport.json",// dataUrl
      fakeImageHash,                      // imageHash (bytes32)
      "https://example.com/preview.jpg",  // imageUrl
      fakeFileHash,                       // fileHash (bytes32) — required for digital
      false                               // dataUrlIsFolderBase — full URL, not folder root
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
    console.log(`     ✅ Human ID: ${humanId}`);

    // 3. Verify resolvePassport works
    console.log("\n  3. Resolving passport...");
    const [passport, creator, proofCount, version] = await contract.resolvePassport(humanId);
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
    network:          networkName,
    chainId:          Number(network.chainId),
    contractAddress:  address,
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
