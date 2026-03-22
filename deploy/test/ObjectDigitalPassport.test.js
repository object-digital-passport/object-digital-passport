/**
 * @file ObjectDigitalPassport — behaviour checks (folder URL resolution, tier mint caps).
 * Run from `deploy/`: npm ci && npx hardhat test
 */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const TYPE_C = "0x43";
const TYPE_B = "0x42";
const TYPE_P = "0x50";

function zeroHash() {
  return ethers.ZeroHash;
}

function nonZeroDataHash(n) {
  return ethers.keccak256(ethers.toUtf8Bytes(`passport-json-${n}`));
}

function nonZeroFileHash(n) {
  return ethers.keccak256(ethers.toUtf8Bytes(`file-${n}`));
}

describe("ObjectDigitalPassport", function () {
  async function deployFixture() {
    const Factory = await ethers.getContractFactory("ObjectDigitalPassport");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    return contract;
  }

  it("SPEC_MAJOR / SPEC_MINOR match packed CONTRACT_VERSION (major*16+minor)", async function () {
    const c = await deployFixture();
    const maj = await c.SPEC_MAJOR();
    const min = await c.SPEC_MINOR();
    const packed = await c.CONTRACT_VERSION();
    expect(Number(maj) * 16 + Number(min)).to.equal(Number(packed));
  });

  /** ethers v6: mintDigital returns a TransactionResponse, not humanId. IDs are random — read last passport for the wallet. */
  async function mintDigitalAndId(contract, signer, args) {
    const tx = await contract.connect(signer).mintDigital(...args);
    await tx.wait();
    const ids = await contract.getPassportsByCreator(signer.address);
    return ids[ids.length - 1];
  }

  describe("getRemainingMints by tier", function () {
    it("C: after one mint, remaining is MONTHLY_LIMIT_C - 1", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const lim = await c.MONTHLY_LIMIT_C();
      expect(await c.getRemainingMints(w.address)).to.equal(lim);
      await c.connect(w).mintDigital(
        2026,
        3,
        nonZeroDataHash(1),
        "",
        zeroHash(),
        "",
        nonZeroFileHash(1),
        false
      );
      expect(await c.getRemainingMints(w.address)).to.equal(lim - 1n);
    });

    it("B: after one mint, remaining is MONTHLY_LIMIT_B - 1", async function () {
      const c = await deployFixture();
      const [_, wB] = await ethers.getSigners();
      await c.connect(wB).registerCreator(TYPE_B);
      const lim = await c.MONTHLY_LIMIT_B();
      expect(await c.getRemainingMints(wB.address)).to.equal(lim);
      await c.connect(wB).mintDigital(
        2026,
        3,
        nonZeroDataHash(2),
        "",
        zeroHash(),
        "",
        nonZeroFileHash(2),
        false
      );
      expect(await c.getRemainingMints(wB.address)).to.equal(lim - 1n);
    });

    it("P: getRemainingMints stays at uint32 max (unlimited)", async function () {
      const c = await deployFixture();
      const [_, __, wP] = await ethers.getSigners();
      await c.connect(wP).registerCreator(TYPE_P);
      const max32 = 2n ** 32n - 1n;
      expect(await c.getRemainingMints(wP.address)).to.equal(max32);
      await c.connect(wP).mintDigital(
        2026,
        3,
        nonZeroDataHash(3),
        "",
        zeroHash(),
        "",
        nonZeroFileHash(3),
        false
      );
      expect(await c.getRemainingMints(wP.address)).to.equal(max32);
    });
  });

  describe("_resolveMintDataUrl (via mintDigital + getPassport)", function () {
    it("stores folderBase/HumanID.json and strips trailing slashes", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const base = "https://example.com/passports///";
      const humanId = await mintDigitalAndId(c, w, [
        2026,
        3,
        nonZeroDataHash(10),
        base,
        zeroHash(),
        "",
        nonZeroFileHash(10),
        true,
      ]);
      const p = await c.getPassport(humanId);
      const expectUrl = `https://example.com/passports/${humanId}.json`;
      expect(p.dataUrl).to.equal(expectUrl);
    });

    it("does not normalize // in the middle of the path (only trailing slashes)", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const base = "https://example.com/foo//bar///";
      const humanId = await mintDigitalAndId(c, w, [
        2026,
        3,
        nonZeroDataHash(12),
        base,
        zeroHash(),
        "",
        nonZeroFileHash(12),
        true,
      ]);
      const p = await c.getPassport(humanId);
      expect(p.dataUrl).to.equal(`https://example.com/foo//bar/${humanId}.json`);
    });

    it("attestExternalDocument stores hash and getExternalDocumentAttestation reads it", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("fake-pdf-bytes"));
      await c.connect(w).attestExternalDocument(docHash, "");
      const r = await c.getExternalDocumentAttestation(w.address, docHash);
      expect(r.attested).to.equal(true);
      expect(r.creatorId).to.match(/^C-/);
      expect(r.timestamp > 0n).to.equal(true);
      await expect(c.connect(w).attestExternalDocument(docHash, "")).to.be.revertedWith(
        "Already attested"
      );
    });

    it("updatePassportUrls sets literal URLs (no folder resolution)", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const humanId = await mintDigitalAndId(c, w, [
        2026,
        3,
        nonZeroDataHash(11),
        "https://a.com/folder/",
        zeroHash(),
        "",
        nonZeroFileHash(11),
        true,
      ]);
      const dh = nonZeroDataHash(11);
      const full = `https://other.host/${humanId}.json`;
      await c.connect(w).updatePassportUrls(humanId, full, "", dh);
      const p = await c.getPassport(humanId);
      expect(p.dataUrl).to.equal(full);
    });
  });
});
