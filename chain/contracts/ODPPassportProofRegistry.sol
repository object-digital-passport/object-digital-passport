// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ODPErrors.sol";
import "./ODPPassportLib.sol";

/**
 * Satellite: passport-bound institutional proofs (P / M attestations).
 * Deploy after `ObjectDigitalPassport`; constructor takes the registry address.
 * Keeps EIP-170 headroom on the main registry while preserving the v0.5 proof model.
 */
interface IODPRegistryForProofs {
    struct CreatorRecord {
        string creatorId;
        address wallet;
        bytes1 typePrefix;
        uint256 timestamp;
    }

    struct PassportClassificationView {
        uint8 contentClass;
        uint8 lifecycleStatus;
        uint8 aiStatus;
        uint8 verificationMethod;
        uint8 editionModel;
        uint256 timestamp;
        bool revoked;
        uint256 revokedAt;
        bytes32 revocationReasonHash;
        address mintAgent;
    }

    function getCreatorByWallet(address wallet) external view returns (string memory);
    function getCreator(string calldata creatorId) external view returns (CreatorRecord memory);
    function getPassportClassification(string calldata passportId)
        external
        view
        returns (PassportClassificationView memory);
}

contract ODPPassportProofRegistry {
    IODPRegistryForProofs public immutable odpRegistry;

    bytes1 private constant TYPE_P = "P";
    bytes1 private constant TYPE_M = "M";
    uint8 private constant CONTRACT_VERSION = 5;

    struct ProofRecord {
        string proofId;
        uint8 contractVersion;
        string prover;
        string passportId;
        bytes32 noteHash;
        string noteUrl;
        uint256 timestamp;
    }

    mapping(uint32 => mapping(uint32 => bool)) private _proofNumberTaken;
    mapping(string => ProofRecord) private _proofs;
    mapping(string => string[]) private _passportProofs;
    mapping(string => string[]) private _institutionProofs;
    uint256 private _proofNonce;

    event ProofSubmitted(
        string indexed proofId,
        string indexed passportId,
        string indexed prover,
        uint256 timestamp
    );

    constructor(address registry_) {
        odpRegistry = IODPRegistryForProofs(registry_);
    }

    function submitProof(
        string calldata passportId,
        bytes32 noteHash,
        string calldata noteUrl,
        uint32 year,
        uint8 month
    ) external returns (string memory proofId) {
        IODPRegistryForProofs.PassportClassificationView memory classification = odpRegistry.getPassportClassification(passportId);
        if (classification.revoked) revert EC(11);
        if (!(bytes(noteUrl).length <= 512)) revert EC(10);
        if (!(year > 0)) revert EC(9);
        if (!(month >= 1 && month <= 12)) revert EC(8);
        _requireUtcYearMonth(year, month);

        string memory callerId = odpRegistry.getCreatorByWallet(msg.sender);
        if (!(bytes(callerId).length > 0)) revert EC(7);
        bytes1 tp = odpRegistry.getCreator(callerId).typePrefix;
        if (!(tp == TYPE_P || tp == TYPE_M)) revert EC(6);

        if (noteHash == bytes32(0)) {
            if (!(bytes(noteUrl).length == 0)) revert EC(5);
        }

        proofId = _generateProofId(year, month, passportId);

        _proofs[proofId] = ProofRecord({
            proofId: proofId,
            contractVersion: CONTRACT_VERSION,
            prover: callerId,
            passportId: passportId,
            noteHash: noteHash,
            noteUrl: noteUrl,
            timestamp: block.timestamp
        });

        _passportProofs[passportId].push(proofId);
        _institutionProofs[callerId].push(proofId);

        emit ProofSubmitted(proofId, passportId, callerId, block.timestamp);
    }

    function getProofsForPassport(string calldata passportId)
        external
        view
        returns (string[] memory)
    {
        return _passportProofs[passportId];
    }

    function getProof(string calldata proofId)
        external
        view
        returns (ProofRecord memory)
    {
        if (!(bytes(_proofs[proofId].proofId).length > 0)) revert EC(4);
        return _proofs[proofId];
    }

    function getProofsByInstitution(string calldata creatorId)
        external
        view
        returns (string[] memory)
    {
        return _institutionProofs[creatorId];
    }

    function _requireUtcYearMonth(uint32 year, uint8 month) private view {
        (uint32 cy, uint8 cm) = ODPPassportLib.utcYearMonthFromTimestamp(block.timestamp);
        if (!(year == cy && month == cm)) revert EC(68);
    }

    function _generateProofId(uint32 year, uint8 month, string memory passportId)
        internal
        returns (string memory)
    {
        uint32 key = uint32(year) * 100 + uint32(month);
        uint256 baseNonce = _proofNonce;
        bytes32 passportIdHash = keccak256(bytes(passportId));
        for (uint256 i = 0; i < 25; i++) {
            // Human-readable PRF ID entropy, not security randomness (mirrors main registry triage).
            // slither-disable-next-line weak-prng
            uint32 n = uint32(uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                msg.sender,
                baseNonce + i,
                key,
                passportIdHash,
                gasleft()
            ))) % 100_000_000);
            if (!_proofNumberTaken[key][n]) {
                _proofNonce = baseNonce + i + 1;
                _proofNumberTaken[key][n] = true;
                return ODPPassportLib.formatPrfId(year, month, n);
            }
        }
        revert EC(60);
    }
}
