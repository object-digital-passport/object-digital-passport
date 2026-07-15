import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const doc = path.join(root, "docs", "EIP170_STRATEGY.md");
const limit = 24576;

function bytesFromArtifact(rel) {
  const p = path.join(root, "artifacts", rel);
  if (!fs.existsSync(p)) return null;
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const hex = j.deployedBytecode ?? j.bytecode;
  if (!hex || typeof hex !== "string") return null;
  return (hex.length - 2) / 2;
}

const mainBytes = bytesFromArtifact(
  "contracts/ObjectDigitalPassport.sol/ObjectDigitalPassport.json",
);
if (mainBytes == null) {
  process.exit(0);
}

let libBytes = 0;
try {
  const b = bytesFromArtifact("contracts/ODPPassportLib.sol/ODPPassportLib.json");
  libBytes = b ?? 0;
} catch {
  libBytes = 0;
}

const libNote = libBytes
  ? `  ODPPassportLib: ${libBytes} bytes (deploy separately, then link).`
  : "";

if (mainBytes > limit) {
  console.log(
    `\n[ODP] EIP-170: ObjectDigitalPassport = ${mainBytes} bytes (limit ${limit}, over by ${mainBytes - limit}).${libNote ? `\n${libNote}` : ""}\n` +
      `  Mitigations: ${doc}\n`,
  );
} else {
  console.log(
    `\n[ODP] EIP-170: ObjectDigitalPassport = ${mainBytes} bytes (within ${limit} limit).${libNote ? `\n${libNote}` : ""}\n`,
  );
}
