/**
 * Resume deploy after ODPPassportLib succeeded but ObjectDigitalPassport failed (e.g. insufficient gas).
 * Skips a new library deploy; links ObjectDigitalPassport to the existing ODPPassportLib, then runs
 * the same optional satellites + Amoy smoke + deployments/*.json + abi.json as deploy.js.
 *
 * Usage:
 *   ODP_PASSPORT_LIB_ADDRESS=0x... npx hardhat run scripts/deploy-resume-from-lib.js --network polygon
 *   npx hardhat run scripts/deploy-resume-from-lib.js --network polygon -- --passport-lib 0x...
 *
 * Author: Andrei Chernikov
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

function parsePassportLibArg() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--passport-lib");
  if (i >= 0 && argv[i + 1]) return argv[i + 1].trim();
  return (process.env.ODP_PASSPORT_LIB_ADDRESS || "").trim();
}

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  if (!deployer) {
    console.error(
      "  Error: no deployer account. Set PRIVATE_KEY in deploy/user-setup/private.local.env (64 hex chars, no 0x prefix). See deploy/user-setup/README.md."
    );
    process.exit(1);
  }
  const network = await ethers.provider.getNetwork();

  const passportLibAddress = parsePassportLibArg();
  if (!passportLibAddress || !/^0x[a-fA-F0-9]{40}$/.test(passportLibAddress)) {
    console.error(
      "  Error: set ODP_PASSPORT_LIB_ADDRESS or pass --passport-lib 0x… (already deployed ODPPassportLib from the previous run)."
    );
    process.exit(1);
  }

  const libCode = await ethers.provider.getCode(passportLibAddress);
  if (!libCode || libCode === "0x") {
    console.error("  Error: no contract bytecode at ODPPassportLib address.");
    process.exit(1);
  }

  console.log("\n  Object Digital Passport — Resume from existing ODPPassportLib");
  console.log("  ─────────────────────────────────────────");
  console.log(`  Network:        ${network.name} (chain ID ${network.chainId})`);
  console.log(`  Deployer:       ${deployer.address}`);
  console.log(`  ODPPassportLib: ${passportLibAddress} (reuse, no redeploy)`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:        ${ethers.formatEther(balance)} POL`);
  console.log();

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

  if (network.chainId === 80002n) {
    console.log("\n  Running smoke test on testnet...");

    console.log(`  Packed byte: ${deployedVersion} (v0.3 = 3: ownership, revocation, extra image hashes, P-affiliation detach)`);

    console.log("\n  1. Registering profile (type C)...");
    const regTx = await contract.registerCreator(
      ethers.hexlify(ethers.toUtf8Bytes("C"))
    );
    await regTx.wait();
    const creatorId = await contract.getCreatorByWallet(deployer.address);
    console.log(`     ✅ Profile ID: ${creatorId}`);

    console.log("\n  2. Minting digital passport...");
    const fakeDataHash  = ethers.keccak256(ethers.toUtf8Bytes("test-passport-json"));
    const fakeFileHash  = ethers.keccak256(ethers.toUtf8Bytes("test-original-file"));
    const fakeImageHash = ethers.keccak256(ethers.toUtf8Bytes("test-preview-image"));
    const now = new Date();

    const z = ethers.ZeroHash;
    const mintTx = await contract.mintDigital(
      now.getFullYear(),
      now.getMonth() + 1,
      fakeDataHash,
      "https://example.com/passport.odpass",
      fakeImageHash,
      "https://example.com/preview.jpg",
      z,
      "",
      z,
      "",
      fakeFileHash,
      false,
      z,
      "",
      ""
    );
    const mintReceipt = await mintTx.wait();

    let passportId = null;
    for (const log of mintReceipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed.name === "PassportMinted") {
          passportId = parsed.args.passportId;
          break;
        }
      } catch {}
    }
    console.log(`     ✅ Passport ID: ${passportId}`);

    console.log("\n  3. Resolving passport (multi-call)...");
    const passport = await contract.getPassport(passportId);
    const proofIds = await contract.getProofsForPassport(passportId);
    const proofCount = proofIds.length;
    const version = await contract.CONTRACT_VERSION();
    console.log(`     ✅ contractVersion: ${version}`);
    console.log(`     ✅ objectType:      ${passport.objectType}`);
    console.log(`     ✅ creatorId:       ${passport.creatorId}`);
    console.log(`     ✅ proofCount:      ${proofCount}`);

    const remaining = await contract.getRemainingMints(deployer.address);
    console.log(`\n  4. Remaining mints this month: ${remaining}`);

    console.log("\n  ✅ Smoke test passed");
  }

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
    counterfeitConcernAddress,
    contractVersion:  Number(deployedVersion),
    deployedBy:       deployer.address,
    deployedAt:       new Date().toISOString(),
    txHash:           contract.deploymentTransaction()?.hash || null,
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`\n  ✅ Saved: deployments/${networkName}.json`);

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
