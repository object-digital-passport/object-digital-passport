/**
 * @file ObjectDigitalPassport — behaviour checks (folder URL resolution, tier mint caps).
 * Run from `deploy/`: npm ci && npm test
 */
import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.connect();

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
/** v0.3+: last mint arg — empty string = mint as caller’s registered profile */
const MINT_SELF = "";

/** Fixed UTC instants for `evm_setNextBlockTimestamp` — must match mint `year`/`month` args. */
const TS_UTC = {
  MAR_2026: Math.floor(Date.parse("2026-03-15T12:00:00.000Z") / 1000),
  JUN_2031: Math.floor(Date.parse("2031-06-10T12:00:00.000Z") / 1000),
};

/** Never move block time backwards (Hardhat rejects); returns the mined block's Unix time. */
async function mineAt(ts) {
  const latest = await ethers.provider.getBlock("latest");
  const t = Math.max(ts, Number(latest.timestamp) + 1);
  await ethers.provider.send("evm_setNextBlockTimestamp", [t]);
  await ethers.provider.send("evm_mine", []);
  return t;
}

/** Set after aligning chain time — must match every `mintDigital` / `mintPhysical` / extension tuple year+month. */
let MINT_Y = 2026;
let MINT_M = 3;

async function syncMintYm() {
  const t = await mineAt(TS_UTC.MAR_2026);
  const d = new Date(t * 1000);
  MINT_Y = d.getUTCFullYear();
  MINT_M = d.getUTCMonth() + 1;
}

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
    await syncMintYm();
    const LibFactory = await ethers.getContractFactory("ODPPassportLib");
    const lib = await LibFactory.deploy();
    await lib.waitForDeployment();
    const libAddress = await lib.getAddress();
    const Factory = await ethers.getContractFactory("ObjectDigitalPassport", {
      libraries: {
        "project/contracts/ODPPassportLib.sol:ODPPassportLib": libAddress,
      },
    });
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    return contract;
  }

  describe("UTC year/month (mint & submitProof)", function () {
    it("reverts EC(68) when mint year/month do not match block UTC calendar", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      await expect(
        c.connect(w).mintDigital(
          2000,
          1,
          nonZeroDataHash(6801),
          "",
          zeroHash(),
          "",
          ...NO_EXTRA_IMAGES,
          nonZeroFileHash(6801),
          false,
          ...AUX_EMPTY,
          MINT_SELF,
        ),
      )
        .to.be.revertedWithCustomError(c, "EC")
        .withArgs(68n);
    });

    it("reverts EC(68) when submitProof month does not match block UTC", async function () {
      const c = await deployFixture();
      const [wC, wP] = await ethers.getSigners();
      await c.connect(wC).registerCreator(TYPE_C);
      const passportId = await mintDigitalAndId(c, wC, [
        MINT_Y,
        MINT_M,
        nonZeroDataHash(6802),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(6802),
        false,
        ...AUX_EMPTY,
        MINT_SELF,
      ]);
      await c.connect(wP).registerCreator(TYPE_P);
      await mineAt(TS_UTC.JUN_2031);
      await expect(c.connect(wP).submitProof(passportId, zeroHash(), "", 2031, 5)).to.be.revertedWithCustomError(c, "EC").withArgs(
        68n,
      );
    });
  });

  it("CONTRACT_VERSION matches major*16+minor (internal SPEC_* constants)", async function () {
    const c = await deployFixture();
    const packed = await c.CONTRACT_VERSION();
    const p = BigInt(packed.toString());
    expect(Number(packed)).to.equal(5); // v0.5 line: SPEC_MAJOR=0, SPEC_MINOR=5
    expect(Number(p / 16n) * 16 + Number(p % 16n)).to.equal(Number(packed));
  });

  /**
   * ethers v6: mintDigital returns a TransactionResponse, not passportId. IDs are random — read last passport for the issuer wallet.
   * @param {string} [passportOwner] when minting via mint agent, pass principal wallet (creator on record); default `signer.address`
   */
  async function mintDigitalAndId(contract, signer, args, passportOwner) {
    const tx = await contract.connect(signer).mintDigital(...args);
    await tx.wait();
    const ownerAddr = passportOwner !== undefined && passportOwner !== null ? passportOwner : signer.address;
    const ids = await contract.getPassportsByCreator(ownerAddr);
    return ids[ids.length - 1];
  }

  describe("getRemainingMints by tier", function () {
    it("C: after one mint, remaining is MONTHLY_LIMIT_C - 1", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const lim = 1000n;
      expect(await c.getRemainingMints(w.address)).to.equal(lim);
      await c.connect(w).mintDigital(
        MINT_Y,
        MINT_M,
        nonZeroDataHash(1),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(1),
        false,
        ...AUX_EMPTY,
        MINT_SELF,
      );
      expect(await c.getRemainingMints(w.address)).to.equal(lim - 1n);
    });

    it("B: after one mint, remaining is MONTHLY_LIMIT_B - 1", async function () {
      const c = await deployFixture();
      const [_, wB] = await ethers.getSigners();
      await c.connect(wB).registerCreator(TYPE_B);
      const lim = 100000n;
      expect(await c.getRemainingMints(wB.address)).to.equal(lim);
      await c.connect(wB).mintDigital(
        MINT_Y,
        MINT_M,
        nonZeroDataHash(2),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(2),
        false,
        ...AUX_EMPTY,
        MINT_SELF,
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
        MINT_Y,
        MINT_M,
        nonZeroDataHash(3),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(3),
        false,
        ...AUX_EMPTY,
        MINT_SELF,
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
        MINT_Y,
        MINT_M,
        nonZeroDataHash(31),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(31),
        false,
        ...AUX_EMPTY,
        MINT_SELF,
      );
      expect(await c.getRemainingMints(wM.address)).to.equal(max32);
    });

    it("M: can submitProof like P", async function () {
      const c = await deployFixture();
      const [wC, wM] = await ethers.getSigners();
      await c.connect(wC).registerCreator(TYPE_C);
      const passportId = await mintDigitalAndId(c, wC, [
        MINT_Y,
        MINT_M,
        nonZeroDataHash(41),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(41),
        false,
        ...AUX_EMPTY,
        MINT_SELF,
      ]);
      await c.connect(wM).registerCreator(TYPE_M);
      await mineAt(TS_UTC.JUN_2031);
      const tx = await c.connect(wM).submitProof(passportId, zeroHash(), "", 2031, 6);
      await tx.wait();
      const ids = await c.getProofsForPassport(passportId);
      expect(ids.length).to.equal(1);
    });
  });

  describe("_resolveMintDataUrl (via mintDigital + getPassport)", function () {
    it("stores folderBase/passportId.odpass and strips trailing slashes", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const base = "https://example.com/passports///";
      const passportId = await mintDigitalAndId(c, w, [
        MINT_Y,
        MINT_M,
        nonZeroDataHash(10),
        base,
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(10),
        true,
        ...AUX_EMPTY,
        MINT_SELF,
      ]);
      const p = await c.getPassport(passportId);
      const expectUrl = `https://example.com/passports/${passportId}.odpass`;
      expect(p.dataUrl).to.equal(expectUrl);
    });

    it("does not normalize // in the middle of the path (only trailing slashes)", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const base = "https://example.com/foo//bar///";
      const passportId = await mintDigitalAndId(c, w, [
        MINT_Y,
        MINT_M,
        nonZeroDataHash(12),
        base,
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(12),
        true,
        ...AUX_EMPTY,
        MINT_SELF,
      ]);
      const p = await c.getPassport(passportId);
      expect(p.dataUrl).to.equal(`https://example.com/foo//bar/${passportId}.odpass`);
    });

    it("updatePassportUrls sets literal URLs (no folder resolution)", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const passportId = await mintDigitalAndId(c, w, [
        MINT_Y,
        MINT_M,
        nonZeroDataHash(11),
        "https://a.com/folder/",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(11),
        true,
        ...AUX_EMPTY,
        MINT_SELF,
      ]);
      const dh = nonZeroDataHash(11);
      const full = `https://other.host/${passportId}.odpass`;
      await c.connect(w).updatePassportUrls(passportId, full, "", dh);
      const p = await c.getPassport(passportId);
      expect(p.dataUrl).to.equal(full);
    });
  });

  describe("v0.3 ownership and lifecycle", function () {
    it("owner starts as creator; transferPassport moves owner", async function () {
      const c = await deployFixture();
      const [wA, wB] = await ethers.getSigners();
      await c.connect(wA).registerCreator(TYPE_C);
      const passportId = await mintDigitalAndId(c, wA, [
        MINT_Y,
        MINT_M,
        nonZeroDataHash(501),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(501),
        false,
        ...AUX_EMPTY,
        MINT_SELF,
      ]);
      let p = await c.getPassport(passportId);
      expect(p.owner).to.equal(wA.address);
      expect(p.mintAgent).to.equal(ethers.ZeroAddress);
      await c.connect(wA).transferPassport(passportId, wB.address);
      p = await c.getPassport(passportId);
      expect(p.owner).to.equal(wB.address);
      expect(p.creator).to.equal(wA.address);
    });

    it("governance or creator can revokePassport; submitProof fails when revoked", async function () {
      const c = await deployFixture();
      const [wA, wP] = await ethers.getSigners();
      await c.connect(wA).registerCreator(TYPE_C);
      const passportId = await mintDigitalAndId(c, wA, [
        MINT_Y,
        MINT_M,
        nonZeroDataHash(502),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(502),
        false,
        ...AUX_EMPTY,
        MINT_SELF,
      ]);
      const reason = ethers.keccak256(ethers.toUtf8Bytes("test-revoke"));
      await c.connect(wA).revokePassport(passportId, reason);
      const p = await c.getPassport(passportId);
      expect(p.revoked).to.equal(true);
      await c.connect(wP).registerCreator(TYPE_P);
      await expect(c.connect(wP).submitProof(passportId, zeroHash(), "", 2031, 1)).to.be.revertedWithCustomError(
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
        MINT_Y,
        MINT_M,
        nonZeroDataHash(900),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(900),
        ...AUX_EMPTY,
      ];
      const payload = encodeDigitalMintPayload(args);
      const tx = await c.connect(w).mintDigitalViaExtension(MINT_CLASS_V, payload, false, "");
      const receipt = await tx.wait();
      const ids = await c.getPassportsByCreator(w.address);
      const passportId = ids[ids.length - 1];
      const p = await c.getPassport(passportId);
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
      expect(ev.args.passportId).to.equal(passportId);
    });

    it("reverts EC(64) when extension not registered", async function () {
      const c = await deployFixture();
      const [w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const payload = encodeDigitalMintPayload([
        MINT_Y,
        MINT_M,
        nonZeroDataHash(901),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(901),
        ...AUX_EMPTY,
      ]);
      await expect(c.connect(w).mintDigitalViaExtension(MINT_CLASS_V, payload, false, ""))
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
      const passportId = await mintDigitalAndId(c, w, [
        MINT_Y,
        MINT_M,
        nonZeroDataHash(777),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(778),
        false,
        auxH,
        "https://coa.example/cert.pdf",
        MINT_SELF,
      ]);
      const p = await c.getPassport(passportId);
      expect(p.auxCommitmentHash).to.equal(auxH);
      expect(p.auxCommitmentUri).to.equal("https://coa.example/cert.pdf");
    });

    it("creator and governance may updatePassportAuxCommitment", async function () {
      const c = await deployFixture();
      const [gov, w] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const passportId = await mintDigitalAndId(c, w, [
        MINT_Y,
        MINT_M,
        nonZeroDataHash(600),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(600),
        false,
        ...AUX_EMPTY,
        MINT_SELF,
      ]);
      const h1 = nonZeroFileHash(601);
      await c.connect(w).updatePassportAuxCommitment(passportId, h1, "https://a.example/a.pdf");
      let p = await c.getPassport(passportId);
      expect(p.auxCommitmentHash).to.equal(h1);
      const h2 = nonZeroFileHash(602);
      await c.connect(gov).updatePassportAuxCommitment(passportId, h2, "https://b.example/b.pdf");
      p = await c.getPassport(passportId);
      expect(p.auxCommitmentHash).to.equal(h2);
    });

    it("non-creator non-governance cannot updatePassportAuxCommitment", async function () {
      const c = await deployFixture();
      const [_, w, w2] = await ethers.getSigners();
      await c.connect(w).registerCreator(TYPE_C);
      const passportId = await mintDigitalAndId(c, w, [
        MINT_Y,
        MINT_M,
        nonZeroDataHash(610),
        "",
        zeroHash(),
        "",
        ...NO_EXTRA_IMAGES,
        nonZeroFileHash(610),
        false,
        ...AUX_EMPTY,
        MINT_SELF,
      ]);
      await c.connect(w2).registerCreator(TYPE_B);
      await expect(
        c.connect(w2).updatePassportAuxCommitment(passportId, nonZeroFileHash(611), "https://x.example/x.pdf")
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
        MINT_Y,
        MINT_M,
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
      const tx = await c.connect(w).mintPhysicalViaExtension(MINT_CLASS_W, payload, false, "");
      const receipt = await tx.wait();
      const ids = await c.getPassportsByCreator(w.address);
      const passportId = ids[ids.length - 1];
      const p = await c.getPassport(passportId);
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
      expect(ev.args.passportId).to.equal(passportId);
    });
  });

  describe("mint agent delegation (v0.3)", function () {
    it("handshake: agent mints on behalf; principal is creator/owner; mintAgent set", async function () {
      const c = await deployFixture();
      const [wArtist, wAgent] = await ethers.getSigners();
      await c.connect(wArtist).registerCreator(TYPE_C);
      const artistId = await c.getCreatorByWallet(wArtist.address);
      await c.connect(wAgent).requestMintAgentRole(artistId);
      const pendKey = ethers.keccak256(
        ethers.solidityPacked(["string", "address"], [artistId, wAgent.address])
      );
      expect(await c.mintAgentDelegationPending(pendKey)).to.equal(true);
      await c.connect(wArtist).confirmMintAgentRole(wAgent.address);
      expect(await c.mintAgentForCreator(artistId)).to.equal(wAgent.address);
      const passportId = await mintDigitalAndId(
        c,
        wAgent,
        [
          MINT_Y,
          MINT_M,
          nonZeroDataHash(701),
          "",
          zeroHash(),
          "",
          ...NO_EXTRA_IMAGES,
          nonZeroFileHash(701),
          false,
          ...AUX_EMPTY,
          artistId,
        ],
        wArtist.address
      );
      const p = await c.getPassport(passportId);
      expect(p.creatorId).to.equal(artistId);
      expect(p.creator).to.equal(wArtist.address);
      expect(p.owner).to.equal(wArtist.address);
      expect(p.mintAgent).to.equal(wAgent.address);
      const ids = await c.getPassportsByCreator(wArtist.address);
      expect(ids.includes(passportId)).to.equal(true);
      const idsAgent = await c.getPassportsByCreator(wAgent.address);
      expect(idsAgent.length).to.equal(0);
    });

    it("non-agent cannot mint on behalf (EC 72)", async function () {
      const c = await deployFixture();
      const [wArtist, wAgent, wEvil] = await ethers.getSigners();
      await c.connect(wArtist).registerCreator(TYPE_C);
      const artistId = await c.getCreatorByWallet(wArtist.address);
      await c.connect(wAgent).requestMintAgentRole(artistId);
      await c.connect(wArtist).confirmMintAgentRole(wAgent.address);
      await expect(
        c.connect(wEvil).mintDigital(
          MINT_Y,
          MINT_M,
          nonZeroDataHash(702),
          "",
          zeroHash(),
          "",
          ...NO_EXTRA_IMAGES,
          nonZeroFileHash(702),
          false,
          ...AUX_EMPTY,
          artistId
        )
      )
        .to.be.revertedWithCustomError(c, "EC")
        .withArgs(72n);
    });

    it("principal monthly limit applies when agent mints", async function () {
      const c = await deployFixture();
      const [wArtist, wAgent] = await ethers.getSigners();
      await c.connect(wArtist).registerCreator(TYPE_C);
      const artistId = await c.getCreatorByWallet(wArtist.address);
      const lim = 1000n;
      expect(await c.getRemainingMints(wArtist.address)).to.equal(lim);
      await c.connect(wAgent).requestMintAgentRole(artistId);
      await c.connect(wArtist).confirmMintAgentRole(wAgent.address);
      await mintDigitalAndId(
        c,
        wAgent,
        [
          MINT_Y,
          MINT_M,
          nonZeroDataHash(703),
          "",
          zeroHash(),
          "",
          ...NO_EXTRA_IMAGES,
          nonZeroFileHash(703),
          false,
          ...AUX_EMPTY,
          artistId,
        ],
        wArtist.address
      );
      expect(await c.getRemainingMints(wArtist.address)).to.equal(lim - 1n);
    });

    it("revokeMintAgentRole blocks further agent mints", async function () {
      const c = await deployFixture();
      const [wArtist, wAgent] = await ethers.getSigners();
      await c.connect(wArtist).registerCreator(TYPE_C);
      const artistId = await c.getCreatorByWallet(wArtist.address);
      await c.connect(wAgent).requestMintAgentRole(artistId);
      await c.connect(wArtist).confirmMintAgentRole(wAgent.address);
      await c.connect(wArtist).revokeMintAgentRole();
      expect(await c.mintAgentForCreator(artistId)).to.equal(ethers.ZeroAddress);
      await expect(
        c.connect(wAgent).mintDigital(
          MINT_Y,
          MINT_M,
          nonZeroDataHash(704),
          "",
          zeroHash(),
          "",
          ...NO_EXTRA_IMAGES,
          nonZeroFileHash(704),
          false,
          ...AUX_EMPTY,
          artistId
        )
      )
        .to.be.revertedWithCustomError(c, "EC")
        .withArgs(72n);
    });
  });

  describe("ODPCounterfeitConcern satellite", function () {
    async function deployRegAndCf() {
      await syncMintYm();
      const LibFactory = await ethers.getContractFactory("ODPPassportLib");
      const lib = await LibFactory.deploy();
      await lib.waitForDeployment();
      const libAddress = await lib.getAddress();
      const Factory = await ethers.getContractFactory("ObjectDigitalPassport", {
        libraries: { "project/contracts/ODPPassportLib.sol:ODPPassportLib": libAddress },
      });
      const reg = await Factory.deploy();
      await reg.waitForDeployment();
      const regAddr = await reg.getAddress();
      const CfF = await ethers.getContractFactory("ODPCounterfeitConcern");
      const cf = await CfF.deploy(regAddr);
      await cf.waitForDeployment();
      return { reg, cf };
    }

    it("P raises and clears concern; getCounterfeitConcern matches", async function () {
      const { reg, cf } = await deployRegAndCf();
      const [wC, wP] = await ethers.getSigners();
      await reg.connect(wC).registerCreator(TYPE_C);
      await (
        await reg.connect(wC).mintDigital(
          MINT_Y,
          MINT_M,
          nonZeroDataHash(800),
          "",
          zeroHash(),
          "",
          ...NO_EXTRA_IMAGES,
          nonZeroFileHash(800),
          false,
          ...AUX_EMPTY,
          MINT_SELF
        )
      ).wait();
      const ids800 = await reg.getPassportsByCreator(wC.address);
      const passportId = ids800[ids800.length - 1];
      await reg.connect(wP).registerCreator(TYPE_P);
      const rh = ethers.keccak256(ethers.toUtf8Bytes("concern"));
      await cf.connect(wP).raiseCounterfeitConcern(passportId, rh);
      let cc = await cf.getCounterfeitConcern(passportId);
      expect(cc.active).to.equal(true);
      expect(cc.reasonHash).to.equal(rh);
      await cf.connect(wP).clearCounterfeitConcern(passportId);
      cc = await cf.getCounterfeitConcern(passportId);
      expect(cc.active).to.equal(false);
    });

    it("reject raise from C profile (EC 6)", async function () {
      const { reg, cf } = await deployRegAndCf();
      const [wC] = await ethers.getSigners();
      await reg.connect(wC).registerCreator(TYPE_C);
      await (
        await reg.connect(wC).mintDigital(
          MINT_Y,
          MINT_M,
          nonZeroDataHash(801),
          "",
          zeroHash(),
          "",
          ...NO_EXTRA_IMAGES,
          nonZeroFileHash(801),
          false,
          ...AUX_EMPTY,
          MINT_SELF
        )
      ).wait();
      const ids801 = await reg.getPassportsByCreator(wC.address);
      const passportId = ids801[ids801.length - 1];
      const rh = ethers.keccak256(ethers.toUtf8Bytes("x"));
      await expect(cf.connect(wC).raiseCounterfeitConcern(passportId, rh))
        .to.be.revertedWithCustomError(cf, "EC")
        .withArgs(6n);
    });
  });
});
