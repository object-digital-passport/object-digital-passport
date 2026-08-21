/**
 * Unit tests for the SPEC 0.7 §20 read layer in web/backend/js/odp-contract.js.
 * Pure logic only — no chain, no browser. Run: node web/backend/test/odp-contract-0.7.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync("web/backend/js/odp-contract.js", "utf8");
// the module is an IIFE bound to `window || globalThis`; in node that is globalThis.
new Function(src)();
const { odpCompareUnitKeySetRoot: cmp, odpSupportsV07: v07, odpReadUnitState: readState } = globalThis;

// root comparison — the §20.3 "root exists twice" rule
const R = "a".repeat(64);
assert.equal(cmp("sha256:" + R, "0x" + R), "match");
assert.equal(cmp("sha256:" + R, "0x" + "b".repeat(64)), "mismatch");
assert.equal(cmp("sha256:" + R, "0x" + "0".repeat(64)), "unregistered");
assert.equal(cmp(null, "0x" + R), "unknown");
assert.equal(cmp("SHA256:" + R.toUpperCase(), "0X" + R), "match", "case and prefix insensitive");

// generation gate
assert.equal(v07(6), false);
assert.equal(v07(7), true);

// state shape, against a stub satellite
const SIGNER = "0x" + "1".repeat(40);
const stub = (edOpen, windowClosed, activatedAt, passports, signer = SIGNER) => ({
  getEdition: async () => ["0x" + R, 100000n, edOpen, windowClosed, signer],
  getActivation: async () => [BigInt(activatedAt), "0x" + "1".repeat(40)],
  getUnitPassports: async () => passports,
});

let s = await readState(stub(true, false, 0, []), "ODP-2026-08-000000001", 42);
assert.equal(s.editionRevocable, true, "no activation yet -> issuer may still revoke");
assert.equal(s.activatedAt, 0);
assert.equal(s.unitAddress, null);
assert.equal(s.passportConflict, false);

s = await readState(stub(true, true, 1770000000, ["ODP-a", "ODP-b"]), "ODP-2026-08-000000001", 42);
assert.equal(s.editionRevocable, false, "window closed after first activation");
assert.equal(s.activatedAt, 1770000000);
assert.equal(s.unitPassports.length, 2);
assert.equal(s.passportConflict, true, "competing passports are surfaced, not hidden");

s = await readState(stub(false, false, 0, []), "ODP-unknown", 0);
assert.equal(s.open, false, "an edition with no key set stops early");

// §20.7 — the published label signer, and the plain-label case
s = await readState(stub(true, false, 0, []), "ODP-2026-08-000000001", 7);
assert.equal(s.labelSigner, SIGNER, "signed-label editions expose the key");
s = await readState(stub(true, false, 0, [], "0x" + "0".repeat(40)), "ODP-2026-08-000000001", 7);
assert.equal(s.labelSigner, null, "a plain-label edition reports no signer, not a zero address");

// §20.7 — the decisions that need no crypto. The payload bytes and the accept/reject
// crypto are proven against Solidity in chain/deploy/test/ODPEditionLabel.test.js,
// because ethers is not installed on this side.
const { odpVerifyLabelSignature: verifyLabel } = globalThis;
const SIG = "0x" + "11".repeat(65);
const base = {
  chainId: 80002, unitsAddress: "0x" + "2".repeat(40),
  editionPassportId: "ODP-2026-08-000000001", unitIndex: 0,
  merkleRoot: "0x" + R, labelSigner: SIGNER,
};

assert.equal(verifyLabel({ ...base, labelSigner: null, signature: SIG }), "unsigned_edition",
  "a plain-label edition is reported as such, never as a failure");
assert.equal(verifyLabel({ ...base, signature: null }), "absent",
  "signed edition, unsigned carrier");
assert.equal(verifyLabel({ ...base, signature: SIG, merkleRoot: null }), "unknown",
  "no root means no decision, not a guess");
assert.equal(verifyLabel({}), "unsigned_edition", "empty input does not throw");

console.log("odp-contract 0.7 read layer: 20 assertions passed");
