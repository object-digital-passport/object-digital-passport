/**
 * @file ObjectDigitalPassport — behaviour checks (folder URL resolution, tier mint caps).
 * Run from `deploy/`: npm ci && npx hardhat test
 */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const TYPE_C = "0x43";
const TYPE_B = "0x42";
const TYPE_P = "0x50";
const TYPE_M = "0x4d";

function zeroHash() {
  return ethers.ZeroHash;
}

function nonZeroDataHash(n) {
  return ethers.keccak256(ethers.toUtf8Bytes(`passport-json-${n}`));
}

function nonZeroFileHash(n) {
  return ethers.keccak256(ethers.toUtf8Bytes(`file-${n}`));
}

/** v0.3: optional second/third image hashes + URLs before fileHash */
const NO_EXTRA_IMAGES = [ethers.ZeroHash, "", ethers.ZeroHash, ""];
/** v0.3: optional aux commitment (hash 0 ⇒ URI must be empty) */
const AUX_EMPTY = [ethers.ZeroHash, ""];

function encodePhysicalMintPayload(args) {
  const coder = ethers.AbiCoder.defaultAbiCoder();
  return coder.encode(
    [
      "uint32",
      "uint8",
      "bytes32",
      "string",
      "bytes32",
      "string",
      "uint8",
      "bytes32",
      "bytes",
      "string",
      "bytes32",
      "string",
      "bytes32",
      "string",
      "bytes32",
      "string",
    ],
    args
  );
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
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(1),
        false,
        ...AUX_EMPTY
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
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(2),
        false,
        ...AUX_EMPTY
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
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(3),
        false,
        ...AUX_EMPTY
      );
      expect(await c.getRemainingMints(wP.address)).to.equal(max32);
    });

    it("M: getRemainingMints stays at uint32 max (unlimited)", async function () {
      const c = await deployFixture();
      const [_, __, ___, wM] = await ethers.getSigners();
      await c.connect(wM).registerCreator(TYPE_M);
      const max32 = 2n ** 32n - 1n;
      expect(await c.getRemainingMints(wM.address)).to.equal(max32);
      await c.connect(wM).mintDigital(
        2026,
        3,
        nonZeroDataHash(31),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(31),
        false,
        ...AUX_EMPTY
      );
      expect(await c.getRemainingMints(wM.address)).to.equal(max32);
    });

    it("M: can submitProof like P", async function () {
      const c = await deployFixture();
      const [wC, wM] = await ethers.getSigners();
      await c.connect(wC).registerCreator(TYPE_C);
      const humanId = await mintDigitalAndId(c, wC, [
        2026,
        3,
        nonZeroDataHash(41),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(41),
        false,
        ...AUX_EMPTY,
      ]);
      await c.connect(wM).registerCreator(TYPE_M);
      const tx = await c.connect(wM).submitProof(humanId, zeroHash(), "", 2031, 6);
      await tx.wait();
      const ids = await c.getProofsForPassport(humanId);
      expect(ids.length).to.equal(1);
    });
  });

  describe("_resolveMintDataUrl (via mintDigital + getPassport)", function () {
    it("stores folderBase/humanId.json and strips trailing slashes", async function () {
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
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(10),
        true,
        ...AUX_EMPTY,
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
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(12),
        true,
        ...AUX_EMPTY,
      ]);
      const p = await c.getPassport(humanId);
      expect(p.dataUrl).to.equal(`https://example.com/foo//bar/${humanId}.json`);
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
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(11),
        true,
        ...AUX_EMPTY,
      ]);
      const dh = nonZeroDataHash(11);
      const full = `https://other.host/${humanId}.json`;
      await c.connect(w).updatePassportUrls(humanId, full, "", dh);
      const p = await c.getPassport(humanId);
      expect(p.dataUrl).to.equal(full);
    });
  });

  describe("v0.3 ownership and lifecycle", function () {
    it("owner starts as creator; transferPassport moves owner", async function () {
      const c = await deployFixture();
      const [wA, wB] = await ethers.getSigners();
      await c.connect(wA).registerCreator(TYPE_C);
      const humanId = await mintDigitalAndId(c, wA, [
        2026,
        3,
        nonZeroDataHash(501),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(501),
        false,
        ...AUX_EMPTY,
      ]);
      let p = await c.getPassport(humanId);
      expect(p.owner).to.equal(wA.address);
      await c.connect(wA).transferPassport(humanId, wB.address);
      p = await c.getPassport(humanId);
      expect(p.owner).to.equal(wB.address);
      expect(p.creator).to.equal(wA.address);
    });

    it("governance or creator can revokePassport; submitProof fails when revoked", async function () {
      const c = await deployFixture();
      const [wA, wP] = await ethers.getSigners();
      await c.connect(wA).registerCreator(TYPE_C);
      const humanId = await mintDigitalAndId(c, wA, [
        2026,
        3,
        nonZeroDataHash(502),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(502),
        false,
        ...AUX_EMPTY,
      ]);
      const reason = ethers.keccak256(ethers.toUtf8Bytes("test-revoke"));
      await c.connect(wA).revokePassport(humanId, reason);
      const p = await c.getPassport(humanId);
      expect(p.revoked).to.equal(true);
      await c.connect(wP).registerCreator(TYPE_P);
      await expect(c.connect(wP).submitProof(humanId, zeroHash(), "", 2031, 1)).to.be.revertedWithCustomError(
        c,
        "EC"
      );
    });

    it("detachPAffiliation sets audit timestamps and clears active parent", async function () {
      const c = await deployFixture();
      const [_, __, wChild, wParent] = await ethers.getSigners();
      await c.connect(wChild).registerCreator(TYPE_P);
      await c.connect(wParent).registerCreator(TYPE_P);
      const childId = await c.getCreatorByWallet(wChild.address);
      const parentId = await c.getCreatorByWallet(wParent.address);
      await c.connect(wChild).proposePAffiliation(parentId);
      await c.connect(wParent).confirmPAffiliation(childId);
      expect(await c.getPAffiliatedParent(childId)).to.equal(parentId);
      let a = await c.getPAffiliationAudit(childId);
      expect(a.joinedAt > 0n).to.equal(true);
      expect(a.detachedAt).to.equal(0n);
      await c.connect(wParent).detachPAffiliation(childId);
      expect(await c.getPAffiliatedParent(childId)).to.equal("");
      a = await c.getPAffiliationAudit(childId);
      expect(a.detachedAt > 0n).to.equal(true);
      expect(a.lastDetachedFromParent).to.equal(parentId);
    });

    it("P raises counterfeit concern; clear by same prover", async function () {
      const c = await deployFixture();
      const [wC, wP] = await ethers.getSigners();
      await c.connect(wC).registerCreator(TYPE_C);
      await c.connect(wP).registerCreator(TYPE_P);
      const humanId = await mintDigitalAndId(c, wC, [
        2026,
        3,
        nonZeroDataHash(503),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(503),
        false,
        ...AUX_EMPTY,
      ]);
      const rh = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await c.connect(wP).raiseCounterfeitConcern(humanId, rh);
      let cc = await c.getCounterfeitConcern(humanId);
      expect(cc.active).to.equal(true);
      await c.connect(wP).clearCounterfeitConcern(humanId);
      cc = await c.getCounterfeitConcern(humanId);
      expect(cc.active).to.equal(false);
    });
  });

  describe("mintDigitalViaExtension (IODPExtension)", function () {
    const MINT_CLASS_V = "0x56";

    function encodeDigitalMintPayload(args) {
      const coder = ethers.AbiCoder.defaultAbiCoder();
      return coder.encode(
        [
          "uint32",
          "uint8",
          "bytes32",
          "string",
          "bytes32",
          "string",
          "bytes32",
          "string",
          "bytes32",
          "string",
          "bytes32",
          "bytes32",
          "string",
        ],
        args
      );
    }

    it("mints after governance setMintExtension", async function () {
      const c = await deployFixture();
      const Ext = await ethers.getContractFactory("ODPPassThroughDigitalExtension");
      const ext = await Ext.deploy();
      await ext.waitForDeployment();
      await c.setMintExtension(MINT_CLASS_V, ext.target);
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const args = [
        2026,
        3,
        nonZeroDataHash(900),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(900),
        ...AUX_EMPTY,
      ];
      const payload = encodeDigitalMintPayload(args);
      const tx = await c.connect(w).mintDigitalViaExtension(MINT_CLASS_V, payload, false);
      const receipt = await tx.wait();
      const ids = await c.getPassportsByCreator(w.address);
      const humanId = ids[ids.length - 1];
      const p = await c.getPassport(humanId);
      expect(p.objectType).to.equal("digital");
      expect(p.dataHash).to.equal(nonZeroDataHash(900));
      const ev = receipt.logs
        .map((l) => {
          try {
            return c.interface.parseLog(l);
          } catch {
            return null;
          }
        })
        .find((x) => x && x.name === "ExtensionMintUsed");
      expect(ev).to.not.equal(undefined);
      expect(ev.args.kind).to.equal(0);
      expect(ev.args.humanId).to.equal(humanId);
    });

    it("reverts EC(64) when extension not registered", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const payload = encodeDigitalMintPayload([
        2026,
        3,
        nonZeroDataHash(901),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(901),
        ...AUX_EMPTY,
      ]);
      await expect(c.connect(w).mintDigitalViaExtension(MINT_CLASS_V, payload, false))
        .to.be.revertedWithCustomError(c, "EC")
        .withArgs(64n);
    });

    it("reverts EC(65) when setMintExtension uses reserved profile byte", async function () {
      const c = await deployFixture();
      const Ext = await ethers.getContractFactory("ODPPassThroughDigitalExtension");
      const ext = await Ext.deploy();
      await ext.waitForDeployment();
      await expect(c.setMintExtension(TYPE_C, ext.target)).to.be.revertedWithCustomError(c, "EC").withArgs(65n);
    });

    it("reverts EC(66) when extension address has no code", async function () {
      const c = await deployFixture();
      const [_, eoa] = await ethers.getSigners();
      await expect(c.setMintExtension(MINT_CLASS_V, eoa.address))
        .to.be.revertedWithCustomError(c, "EC")
        .withArgs(66n);
    });

    it("non-governance cannot setMintExtension", async function () {
      const c = await deployFixture();
      const [_, w2] = await ethers.getSigners();
      const Ext = await ethers.getContractFactory("ODPPassThroughDigitalExtension");
      const ext = await Ext.deploy();
      await ext.waitForDeployment();
      await expect(c.connect(w2).setMintExtension(MINT_CLASS_V, ext.target))
        .to.be.revertedWithCustomError(c, "EC")
        .withArgs(56n);
    });
  });

  describe("v0.3 aux commitment and physical extension", function () {
    const MINT_CLASS_W = "0x57";

    it("mintDigital stores aux commitment when provided", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const auxH = nonZeroFileHash(777);
      const humanId = await mintDigitalAndId(c, w, [
        2026,
        3,
        nonZeroDataHash(777),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(778),
        false,
        auxH,
        "https://coa.example/cert.pdf",
      ]);
      const p = await c.getPassport(humanId);
      expect(p.auxCommitmentHash).to.equal(auxH);
      expect(p.auxCommitmentUri).to.equal("https://coa.example/cert.pdf");
    });

    it("creator and governance may updatePassportAuxCommitment", async function () {
      const c = await deployFixture();
      const [gov, w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const humanId = await mintDigitalAndId(c, w, [
        2026,
        3,
        nonZeroDataHash(600),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(600),
        false,
        ...AUX_EMPTY,
      ]);
      const h1 = nonZeroFileHash(601);
      await c.connect(w).updatePassportAuxCommitment(humanId, h1, "https://a.example/a.pdf");
      let p = await c.getPassport(humanId);
      expect(p.auxCommitmentHash).to.equal(h1);
      const h2 = nonZeroFileHash(602);
      await c.connect(gov).updatePassportAuxCommitment(humanId, h2, "https://b.example/b.pdf");
      p = await c.getPassport(humanId);
      expect(p.auxCommitmentHash).to.equal(h2);
    });

    it("non-creator non-governance cannot updatePassportAuxCommitment", async function () {
      const c = await deployFixture();
      const [_, w, w2] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const humanId = await mintDigitalAndId(c, w, [
        2026,
        3,
        nonZeroDataHash(610),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(610),
        false,
        ...AUX_EMPTY,
      ]);
      await c.connect(w2).registerCreator(TYPE_B);
      await expect(
        c.connect(w2).updatePassportAuxCommitment(humanId, nonZeroFileHash(611), "https://x.example/x.pdf")
      )
        .to.be.revertedWithCustomError(c, "EC")
        .withArgs(67n);
    });

    it("mintPhysicalViaExtension mints physical and emits ExtensionMintUsed kind=1", async function () {
      const c = await deployFixture();
      const Ext = await ethers.getContractFactory("ODPPassThroughPhysicalExtension");
      const ext = await Ext.deploy();
      await ext.waitForDeployment();
      await c.setMintExtension(MINT_CLASS_W, ext.target);
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const phyArgs = [
        2026,
        3,
        nonZeroDataHash(920),
        "",
        zeroHash(),
        "",
        2,
        nonZeroFileHash(920),
        "0x",
        "",
        ...NO_EXTRA_IMAGES,
        ...AUX_EMPTY,
      ];
      const payload = encodePhysicalMintPayload(phyArgs);
      const tx = await c.connect(w).mintPhysicalViaExtension(MINT_CLASS_W, payload, false);
      const receipt = await tx.wait();
      const ids = await c.getPassportsByCreator(w.address);
      const humanId = ids[ids.length - 1];
      const p = await c.getPassport(humanId);
      expect(p.objectType).to.equal("physical");
      const ev = receipt.logs
        .map((l) => {
          try {
            return c.interface.parseLog(l);
          } catch {
            return null;
          }
        })
        .find((x) => x && x.name === "ExtensionMintUsed");
      expect(ev).to.not.equal(undefined);
      expect(ev.args.kind).to.equal(1);
      expect(ev.args.humanId).to.equal(humanId);
    });
  });
});
