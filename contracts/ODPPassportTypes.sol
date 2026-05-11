// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Bundles digital mint fields (matches ObjectDigitalPassport layout).
struct DigitalMintInputs {
    uint32 year;
    uint8 month;
    uint8 contentClass;
    bytes32 dataHash;
    string dataUrl;
    bytes32 imageHash;
    string imageUrl;
    bytes32 imageHash2;
    string imageUrl2;
    bytes32 imageHash3;
    string imageUrl3;
    bytes32 fileHash;
    bytes32 auxCommitmentHash;
    string auxCommitmentUri;
}

/// @dev Bundles physical mint fields (matches ObjectDigitalPassport layout).
struct PhysicalMintInputs {
    uint32 year;
    uint8 month;
    uint8 contentClass;
    bytes32 dataHash;
    string dataUrl;
    bytes32 imageHash;
    string imageUrl;
    uint8 sealType;
    bytes32 sealHash;
    bytes nfcPublicKey;
    string nfcModel;
    bytes32 imageHash2;
    string imageUrl2;
    bytes32 imageHash3;
    string imageUrl3;
    bytes32 auxCommitmentHash;
    string auxCommitmentUri;
}
