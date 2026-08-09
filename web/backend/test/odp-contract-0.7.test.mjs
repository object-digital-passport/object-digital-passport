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
const stub = (edOpen, windowClosed, activatedAt, passports) => ({
  getEdition: async () => ["0x" + R, 100000n, edOpen, windowClosed],
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

console.log("odp-contract 0.7 read layer: 14 assertions passed");
