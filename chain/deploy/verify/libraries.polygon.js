/**
 * Library addresses for `hardhat verify --libraries-path` on Polygon mainnet.
 *
 * `ObjectDigitalPassport` is deployed **linked** against `ODPPassportLib` (the heavy pure
 * validation logic lives there so the registry stays under the EIP-170 24 KiB limit).
 * Etherscan cannot recover a linked library address from bytecode alone, so verification
 * of the main registry must be told which address was linked in.
 *
 * The key format matches what the deploy scripts pass to `getContractFactory`
 * (Hardhat 3 source names are prefixed with the project name) — see
 * `chain/deploy/scripts/deploy.js`.
 *
 * Satellites (`ODPCounterfeitConcern`, `ODPRegistryRelations`, `ODPPassportProofRegistry`,
 * `ODPExtensionMintRouter`, `ODPWalletDocumentAnchor`, `ODPAuthorAttestation`) link no
 * libraries — they do not need this file.
 *
 * Author: Andrei Chernikov
 */

export default {
  "project/contracts/ODPPassportLib.sol:ODPPassportLib": "0xB7D7B8485eeb385c375ABd91035F5a6914171ccE",
};
