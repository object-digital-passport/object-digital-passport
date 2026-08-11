/**
 * Generates the known-answer vectors for SPEC 0.7 §20 edition unit keys.
 *
 * These exist so a second implementation — an issuer tool in any language — can prove it
 * agrees with this one before a single label is printed. Every step that turns bits into
 * bytes is a place two implementations silently diverge, and after printing there is no fix.
 *
 * Run:  node chain/tools/edition_vectors.mjs > schema/vectors/edition-units.json
 * Check: chain/deploy/test/ODPEditionVectors.test.js asserts this file against Solidity.
 */
import crypto from "node:crypto";
import { Wallet, getAddress, keccak256, concat, toUtf8Bytes, toBeHex, zeroPadValue } from "ethers";

// Fixed inputs. Not secret — these are test vectors, never a real edition.
const MASTER_SEED = Buffer.from("00".repeat(31) + "2a", "hex"); // 32 bytes
const CHAIN_ID = 80002; // Polygon Amoy
const CONTRACT = getAddress("0x000000000000000000000000000000000000dEaD");
const EDITION_ID = "ODP-2026-08-004829415";
const UNIT_COUNT = 5;

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // no I, L, O, U

/** SPEC §20.5 — editionContext = utf8(chainId) || 0x00 || utf8(editionPassportId) */
function editionContext() {
  return Buffer.concat([
    Buffer.from(String(CHAIN_ID), "utf8"),
    Buffer.from([0]),
    Buffer.from(EDITION_ID, "utf8"),
  ]);
}

function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

/** HKDF-SHA256 with an empty salt, as §20.5 specifies. */
function hkdf(ikm, info, len) {
  return Buffer.from(crypto.hkdfSync("sha256", ikm, Buffer.alloc(0), info, len));
}

/**
 * SPEC §20.5 — the leading 100 bits of unitSecret_i as 13 bytes: bytes 0..11 verbatim,
 * the low 4 bits of byte 12 cleared. Pinned because this value is hashed.
 */
function printedSeed(unitSecret) {
  const s = Buffer.from(unitSecret.subarray(0, 13));
  s[12] &= 0xf0;
  return s;
}

/** SPEC §20.6 — 20 Crockford Base32 characters carrying exactly those 100 bits, MSB first. */
function encodePayload(seed13) {
  let bits = "";
  for (const byte of seed13) bits += byte.toString(2).padStart(8, "0");
  bits = bits.slice(0, 100);
  let out = "";
  for (let i = 0; i < 100; i += 5) out += CROCKFORD[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function decodePayload(payload20) {
  let bits = "";
  for (const ch of payload20) bits += CROCKFORD.indexOf(ch).toString(2).padStart(5, "0");
  const out = Buffer.alloc(13);
  for (let i = 0; i < 13; i++) out[i] = parseInt(bits.slice(i * 8, i * 8 + 8).padEnd(8, "0"), 2);
  return out;
}

/** SPEC §20.6 — leading 25 bits of SHA-256 over the ASCII of the normalized payload. */
function checkChars(payload20) {
  const h = crypto.createHash("sha256").update(Buffer.from(payload20, "ascii")).digest();
  let bits = "";
  for (const byte of h.subarray(0, 4)) bits += byte.toString(2).padStart(8, "0");
  bits = bits.slice(0, 25);
  let out = "";
  for (let i = 0; i < 25; i += 5) out += CROCKFORD[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

/** SPEC §20.6 — uppercase, strip hyphens/whitespace, then Crockford I/L→1, O→0. */
function normalize(text) {
  return String(text)
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
}

function group(code25) {
  return code25.match(/.{1,5}/g).join("-");
}

/** SPEC §20.5 — the key derives from the printed value alone, plus data a verifier has. */
function unitKeyFromPrintedSeed(seed13, ctx) {
  const h = crypto
    .createHash("sha256")
    .update(Buffer.concat([Buffer.from("ODP-UNIT-KEY-v1", "utf8"), seed13, ctx]))
    .digest();
  return new Wallet("0x" + h.toString("hex"));
}

const sha256 = (...parts) =>
  "0x" + crypto.createHash("sha256").update(Buffer.concat(parts.map((p) => Buffer.from(p.replace?.(/^0x/, "") ?? p, typeof p === "string" ? "hex" : undefined)))).digest("hex");

function sha256Bufs(...bufs) {
  return "0x" + crypto.createHash("sha256").update(Buffer.concat(bufs)).digest("hex");
}
const hexToBuf = (h) => Buffer.from(h.replace(/^0x/, ""), "hex");

/** SPEC §20.3 — leaf = SHA-256(uint32be(index) || address20) */
function leafOf(index, address) {
  return sha256Bufs(u32be(index), hexToBuf(address));
}

/** SPEC §20.3 — binary tree, interior = SHA-256(left || right), last node duplicated on odd levels. */
function buildTree(leaves) {
  const levels = [leaves];
  let level = leaves;
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const right = i + 1 < level.length ? level[i + 1] : level[i];
      next.push(sha256Bufs(hexToBuf(level[i]), hexToBuf(right)));
    }
    levels.push(next);
    level = next;
  }
  return { root: level[0], levels };
}

function proofFor(levels, index) {
  const proof = [];
  let idx = index;
  for (let d = 0; d < levels.length - 1; d++) {
    const lvl = levels[d];
    proof.push(lvl[(idx & 1) === 0 ? Math.min(idx + 1, lvl.length - 1) : idx - 1]);
    idx >>= 1;
  }
  return proof;
}

// ── build ────────────────────────────────────────────────────────────────────

const ctx = editionContext();
const units = [];
for (let i = 0; i < UNIT_COUNT; i++) {
  const unitSecret = hkdf(MASTER_SEED, Buffer.concat([ctx, u32be(i)]), 32);
  const seed13 = printedSeed(unitSecret);
  const payload = encodePayload(seed13);
  const check = checkChars(payload);
  const wallet = unitKeyFromPrintedSeed(seed13, ctx);

  // round-trip: the printed text must decode back to the same 13 bytes
  if (!decodePayload(normalize(group(payload + check)).slice(0, 20)).equals(seed13)) {
    throw new Error("encode/decode round-trip failed at index " + i);
  }

  units.push({
    unitIndex: i,
    unitSecretHex: "0x" + unitSecret.toString("hex"),
    printedSeedHex: "0x" + seed13.toString("hex"),
    payload,
    check,
    printedCode: group(payload + check),
    unitAddress: wallet.address,
    leaf: leafOf(i, wallet.address),
  });
}

const { root, levels } = buildTree(units.map((u) => u.leaf));

const labelSigner = new Wallet(keccak256(toUtf8Bytes("odp-vector-label-signer")));

const packed = (parts) => keccak256(concat(parts));
const activationPayloadHash = (i) =>
  packed([
    toUtf8Bytes("ODP-UNIT-ACTIVATE-v1"),
    zeroPadValue(toBeHex(CHAIN_ID), 32),
    CONTRACT,
    toUtf8Bytes(EDITION_ID),
    zeroPadValue(toBeHex(i), 4),
  ]);
const labelPayloadHash = (i) =>
  packed([
    toUtf8Bytes("ODP-UNIT-LABEL-v1"),
    zeroPadValue(toBeHex(CHAIN_ID), 32),
    CONTRACT,
    toUtf8Bytes(EDITION_ID),
    zeroPadValue(toBeHex(i), 4),
    root,
  ]);

const out = {
  $comment:
    "Known-answer vectors for SPEC 0.7 §20. Generated by chain/tools/edition_vectors.mjs; asserted against Solidity by chain/deploy/test/ODPEditionVectors.test.js. Inputs are fixed and public — never a real edition.",
  spec: "0.7",
  inputs: {
    masterSeedHex: "0x" + MASTER_SEED.toString("hex"),
    chainId: CHAIN_ID,
    contract: CONTRACT,
    editionPassportId: EDITION_ID,
    unitCount: UNIT_COUNT,
    editionContextHex: "0x" + ctx.toString("hex"),
    alphabet: CROCKFORD,
  },
  merkleRoot: root,
  levels,
  units,
  proofs: Object.fromEntries(units.map((u) => [u.unitIndex, proofFor(levels, u.unitIndex)])),
  activation: Object.fromEntries(
    units.map((u) => [u.unitIndex, { payloadHash: activationPayloadHash(u.unitIndex) }]),
  ),
  label: {
    signerAddress: labelSigner.address,
    payloadHash: Object.fromEntries(units.map((u) => [u.unitIndex, labelPayloadHash(u.unitIndex)])),
  },
};

process.stdout.write(JSON.stringify(out, null, 2) + "\n");
