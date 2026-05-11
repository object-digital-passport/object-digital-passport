// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ODPErrors.sol";
import {
    DigitalMintInputs,
    MixedMintInputs,
    PassportCoreMintInputs,
    PhysicalMintInputs
} from "./ODPPassportTypes.sol";

/// @dev Linked library: validation + decode + URL resolution for ObjectDigitalPassport (EIP-170 size).
library ODPPassportLib {
    bytes32 private constant NFC_NTAG424DNA_HASH = keccak256("NTAG424DNA");
    bytes32 private constant NFC_NTAG424DNA_TAGTAMPER_HASH = keccak256("NTAG424DNA_TAGTAMPER");

    uint8 private constant CONTENT_CLASS_STATIC = 1;
    uint8 private constant CONTENT_CLASS_EXECUTABLE = 6;
    uint8 private constant STATUS_CONCEPT = 1;
    uint8 private constant STATUS_ARCHIVED = 4;
    uint8 private constant AI_STATUS_NONE = 1;
    uint8 private constant AI_STATUS_GENERATED = 3;
    uint8 private constant VERIFY_SELF = 1;
    uint8 private constant VERIFY_HYBRID = 5;
    uint8 private constant EDITION_UNIQUE = 1;
    uint8 private constant EDITION_DYNAMIC = 4;

    function validateContentClass(uint8 contentClass) public pure {
        if (!(contentClass >= CONTENT_CLASS_STATIC && contentClass <= CONTENT_CLASS_EXECUTABLE)) revert EC(84);
    }

    function validateLifecycleStatus(uint8 lifecycleStatus) public pure {
        if (!(lifecycleStatus >= STATUS_CONCEPT && lifecycleStatus <= STATUS_ARCHIVED)) revert EC(85);
    }

    function validateAiStatus(uint8 aiStatus) public pure {
        if (!(aiStatus >= AI_STATUS_NONE && aiStatus <= AI_STATUS_GENERATED)) revert EC(86);
    }

    function validateVerificationMethod(uint8 verificationMethod) public pure {
        if (!(verificationMethod >= VERIFY_SELF && verificationMethod <= VERIFY_HYBRID)) revert EC(87);
    }

    function validateEditionModel(uint8 editionModel) public pure {
        if (!(editionModel >= EDITION_UNIQUE && editionModel <= EDITION_DYNAMIC)) revert EC(88);
    }

    function validateOptionalImageSlots(
        bytes32 imageHash2,
        string memory imageUrl2,
        bytes32 imageHash3,
        string memory imageUrl3
    ) public pure {
        if (imageHash2 == bytes32(0)) {
            if (!(bytes(imageUrl2).length == 0)) revert EC(41);
        } else {
            if (!(bytes(imageUrl2).length <= 512)) revert EC(40);
        }
        if (imageHash3 == bytes32(0)) {
            if (!(bytes(imageUrl3).length == 0)) revert EC(39);
        } else {
            if (!(bytes(imageUrl3).length <= 512)) revert EC(38);
            if (!(imageHash2 != bytes32(0))) revert EC(37);
        }
    }

    function validateAuxCommitmentFields(bytes32 auxHash, string memory auxUri) public pure {
        if (auxHash == bytes32(0)) {
            if (!(bytes(auxUri).length == 0)) revert EC(70);
        } else {
            if (!(bytes(auxUri).length <= 512)) revert EC(24);
        }
    }

    function validateNdppCommitmentFields(bytes32 ndppHash, string memory ndppUri) public pure {
        if (ndppHash == bytes32(0)) {
            if (!(bytes(ndppUri).length == 0)) revert EC(70);
        } else {
            if (!(bytes(ndppUri).length <= 512)) revert EC(24);
        }
    }

    function validateDamageHistoryFields(bytes32 damageHistoryHash, string memory damageHistoryUrl) public pure {
        if (damageHistoryHash == bytes32(0)) {
            if (!(bytes(damageHistoryUrl).length == 0)) revert EC(89);
        } else {
            if (!(bytes(damageHistoryUrl).length <= 512)) revert EC(90);
        }
    }

    function validatePassportCore(PassportCoreMintInputs memory core) public pure {
        if (!(core.year > 0)) revert EC(9);
        if (!(core.month >= 1 && core.month <= 12)) revert EC(8);
        if (!(bytes(core.title).length > 0)) revert EC(91);
        if (!(bytes(core.title).length <= 256)) revert EC(92);
        if (!(bytes(core.domain).length <= 128)) revert EC(93);
        validateContentClass(core.contentClass);
        validateLifecycleStatus(core.lifecycleStatus);
        validateAiStatus(core.aiStatus);
        validateVerificationMethod(core.verificationMethod);
        validateEditionModel(core.editionModel);
        if (!(bytes(core.currentLocation).length <= 256)) revert EC(94);
        if (!(bytes(core.rightsNote).length <= 256)) revert EC(95);
        if (!(bytes(core.conditionNote).length <= 256)) revert EC(96);
        validateDamageHistoryFields(core.damageHistoryHash, core.damageHistoryUrl);
    }

    function validateCommonHashesAndUrls(
        bytes32 dataHash,
        string memory dataUrl,
        bytes32 imageHash,
        string memory imageUrl,
        bytes32 imageHash2,
        string memory imageUrl2,
        bytes32 imageHash3,
        string memory imageUrl3
    ) public pure {
        if (!(dataHash != bytes32(0))) revert EC(30);
        if (!(bytes(dataUrl).length <= 512)) revert EC(24);
        if (!(bytes(imageUrl).length <= 512)) revert EC(23);
        if (imageHash == bytes32(0)) {
            if (!(bytes(imageUrl).length == 0)) revert EC(28);
        }
        validateOptionalImageSlots(imageHash2, imageUrl2, imageHash3, imageUrl3);
    }

    function validateNfcModel(string memory nfcModel) public pure {
        bytes32 h = keccak256(bytes(nfcModel));
        if (!(h == NFC_NTAG424DNA_HASH || h == NFC_NTAG424DNA_TAGTAMPER_HASH)) revert EC(33);
    }

    function validateSealFields(
        uint8 sealType,
        bytes32 sealHash,
        bytes memory nfcPublicKey,
        string memory nfcModel
    ) public pure {
        if (!(sealType >= 1 && sealType <= 3)) revert EC(36);
        if (!(sealHash != bytes32(0))) revert EC(35);
        if (sealType == 1 || sealType == 3) {
            if (!(nfcPublicKey.length > 0)) revert EC(34);
            validateNfcModel(nfcModel);
        } else {
            if (!(bytes(nfcModel).length == 0)) revert EC(32);
            if (!(nfcPublicKey.length == 0)) revert EC(97);
        }
    }

    function validatePhysicalMintForMint(PhysicalMintInputs memory m) public pure {
        validatePassportCore(m.core);
        validateCommonHashesAndUrls(
            m.dataHash,
            m.dataUrl,
            m.imageHash,
            m.imageUrl,
            m.imageHash2,
            m.imageUrl2,
            m.imageHash3,
            m.imageUrl3
        );
        validateSealFields(m.sealType, m.sealHash, m.nfcPublicKey, m.nfcModel);
        validateAuxCommitmentFields(m.auxCommitmentHash, m.auxCommitmentUri);
        validateNdppCommitmentFields(m.ndppCommitmentHash, m.ndppCommitmentUri);
    }

    function validateDigitalMintInputs(DigitalMintInputs memory m) public pure {
        validatePassportCore(m.core);
        validateCommonHashesAndUrls(
            m.dataHash,
            m.dataUrl,
            m.imageHash,
            m.imageUrl,
            m.imageHash2,
            m.imageUrl2,
            m.imageHash3,
            m.imageUrl3
        );
        if (!(m.fileHash != bytes32(0))) revert EC(29);
        validateAuxCommitmentFields(m.auxCommitmentHash, m.auxCommitmentUri);
        validateNdppCommitmentFields(m.ndppCommitmentHash, m.ndppCommitmentUri);
    }

    function validateMixedMintInputs(MixedMintInputs memory m) public pure {
        validatePassportCore(m.core);
        validateCommonHashesAndUrls(
            m.dataHash,
            m.dataUrl,
            m.imageHash,
            m.imageUrl,
            m.imageHash2,
            m.imageUrl2,
            m.imageHash3,
            m.imageUrl3
        );
        if (!(m.fileHash != bytes32(0))) revert EC(29);
        validateSealFields(m.sealType, m.sealHash, m.nfcPublicKey, m.nfcModel);
        validateAuxCommitmentFields(m.auxCommitmentHash, m.auxCommitmentUri);
        validateNdppCommitmentFields(m.ndppCommitmentHash, m.ndppCommitmentUri);
    }

    function decodeDigitalExtensionNorm(bytes memory norm) public pure returns (DigitalMintInputs memory dm) {
        dm = abi.decode(norm, (DigitalMintInputs));
    }

    function decodeAndValidateDigitalExtensionNorm(bytes memory norm) public pure returns (DigitalMintInputs memory dm) {
        dm = decodeDigitalExtensionNorm(norm);
        validateDigitalMintInputs(dm);
    }

    function decodeAndValidatePhysicalExtensionNorm(bytes memory norm) public pure returns (PhysicalMintInputs memory pm) {
        pm = decodePhysicalExtensionNorm(norm);
        validatePhysicalMintForMint(pm);
    }

    function decodePhysicalExtensionNorm(bytes memory norm) public pure returns (PhysicalMintInputs memory pm) {
        pm = abi.decode(norm, (PhysicalMintInputs));
    }

    function trimTrailingSlashBytes(bytes memory b) internal pure returns (bytes memory) {
        uint256 end = b.length;
        while (end > 0 && b[end - 1] == 0x2f) {
            unchecked {
                end--;
            }
        }
        if (end == b.length) {
            return b;
        }
        bytes memory out = new bytes(end);
        for (uint256 i = 0; i < end; i++) {
            out[i] = b[i];
        }
        return out;
    }

    function stripTrailingSlashMemory(string memory s) public pure returns (string memory) {
        return string(trimTrailingSlashBytes(bytes(s)));
    }

    /// @param dataUrl When `dataUrlIsFolderBase` is true, folder root only; stored URL becomes `folderBase/passportId.odpass` (§15 ZIP bundle, not raw JSON).
    function resolveMintDataUrlMemory(
        string memory dataUrl,
        bool dataUrlIsFolderBase,
        string memory passportId
    ) public pure returns (string memory) {
        if (bytes(dataUrl).length == 0) {
            if (!(!dataUrlIsFolderBase)) revert EC(31);
            return "";
        }
        if (!dataUrlIsFolderBase) {
            return dataUrl;
        }
        string memory base = stripTrailingSlashMemory(dataUrl);
        return string(abi.encodePacked(base, "/", passportId, ".odpass"));
    }

    // ─── UTC calendar (ODP-ID / PRF-ID must match mint/proof block month in UTC) ─

    function _isLeapYear(uint256 y) private pure returns (bool) {
        return ((y % 4 == 0) && (y % 100 != 0)) || (y % 400 == 0);
    }

    function _daysInYear(uint256 y) private pure returns (uint256) {
        return _isLeapYear(y) ? 366 : 365;
    }

    function _daysInMonth(uint256 m, uint256 y) private pure returns (uint256) {
        if (m == 1 || m == 3 || m == 5 || m == 7 || m == 8 || m == 10 || m == 12) return 31;
        if (m == 4 || m == 6 || m == 9 || m == 11) return 30;
        return _isLeapYear(y) ? 29 : 28;
    }

    /// @dev Gregorian UTC: Unix `ts` seconds since 1970-01-01 00:00:00 UTC.
    /// @notice Reverts EC(83) if `ts` is outside a supported range (internal calendar loop bound).
    function utcYearMonthFromTimestamp(uint256 ts) public pure returns (uint32 year, uint8 month) {
        uint256 dayCount = ts / 86400;
        uint256 y = 1970;
        for (uint256 i = 0; i < 600; i++) {
            uint256 diy = _daysInYear(y);
            if (dayCount < diy) {
                break;
            }
            dayCount -= diy;
            y++;
        }
        if (dayCount >= _daysInYear(y)) revert EC(83);

        uint256 m = 1;
        uint256 rem = dayCount;
        bool found;
        for (uint256 mi = 1; mi <= 12; mi++) {
            uint256 dim = _daysInMonth(mi, y);
            if (rem < dim) {
                m = mi;
                found = true;
                break;
            }
            rem -= dim;
        }
        if (!found) revert EC(83);

        year = uint32(y);
        month = uint8(m);
    }

    // ─── String formatters (ID building; linked to shrink main contract EIP-170 size) ─

    function yearToString(uint32 v) public pure returns (string memory) {
        if (v == 0) return "0";
        uint32 temp = v;
        uint256 len = 0;
        while (temp > 0) {
            len++;
            temp /= 10;
        }
        bytes memory b = new bytes(len);
        for (uint256 i = len; i > 0; i--) {
            b[i - 1] = bytes1(uint8(48 + v % 10));
            v /= 10;
        }
        return string(b);
    }

    function monthToString(uint8 v) public pure returns (string memory) {
        bytes memory b = new bytes(2);
        b[1] = bytes1(uint8(48 + v % 10));
        b[0] = bytes1(uint8(48 + (v / 10) % 10));
        return string(b);
    }

    function pad8(uint32 v) public pure returns (string memory) {
        bytes memory b = new bytes(8);
        for (uint256 i = 8; i > 0; i--) {
            b[i - 1] = bytes1(uint8(48 + v % 10));
            v /= 10;
        }
        return string(b);
    }

    function formatOdpPassportId(uint32 year, uint8 month, uint32 n) public pure returns (string memory) {
        return string(abi.encodePacked("ODP-", yearToString(year), "-", monthToString(month), "-", pad9(n)));
    }

    function formatPrfId(uint32 year, uint8 month, uint32 n) public pure returns (string memory) {
        return string(abi.encodePacked("PRF-", yearToString(year), "-", monthToString(month), "-", pad8(n)));
    }

    function pad9(uint32 v) public pure returns (string memory) {
        bytes memory b = new bytes(9);
        for (uint256 i = 9; i > 0; i--) {
            b[i - 1] = bytes1(uint8(48 + v % 10));
            v /= 10;
        }
        return string(b);
    }

    function pad3(uint32 v) public pure returns (string memory) {
        bytes memory b = new bytes(3);
        b[2] = bytes1(uint8(48 + v % 10));
        b[1] = bytes1(uint8(48 + (v / 10) % 10));
        b[0] = bytes1(uint8(48 + (v / 100) % 10));
        return string(b);
    }

    /// @dev "C-482-930-174-005" style creator id body from type prefix and number.
    function buildCreatorId(bytes1 typePrefix, uint64 number) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                string(abi.encodePacked(typePrefix)),
                "-",
                pad3(uint32(number / 1_000_000_000)),
                "-",
                pad3(uint32((number / 1_000_000) % 1_000)),
                "-",
                pad3(uint32((number / 1_000) % 1_000)),
                "-",
                pad3(uint32(number % 1_000))
            )
        );
    }
}
