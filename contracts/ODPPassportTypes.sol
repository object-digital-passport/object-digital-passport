// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Shared v0.5 classification + mutable-state fields captured at mint.
struct PassportCoreMintInputs {
    uint32 year;
    uint8 month;
    string title;
    string domain;
    uint8 contentClass;
    uint8 lifecycleStatus;
    uint8 aiStatus;
    uint8 verificationMethod;
    uint8 editionModel;
    string currentLocation;
    string rightsNote;
    string conditionNote;
    bytes32 damageHistoryHash;
    string damageHistoryUrl;
}

/// @dev Bundles digital mint fields (matches ObjectDigitalPassport layout).
struct DigitalMintInputs {
    PassportCoreMintInputs core;
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
    bytes32 ndppCommitmentHash;
    string ndppCommitmentUri;
}

/// @dev Bundles physical mint fields (matches ObjectDigitalPassport layout).
struct PhysicalMintInputs {
    PassportCoreMintInputs core;
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
    bytes32 ndppCommitmentHash;
    string ndppCommitmentUri;
}

/// @dev Mixed objects carry both a digital file anchor and a physical seal.
struct MixedMintInputs {
    PassportCoreMintInputs core;
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
    bytes32 fileHash;
    bytes32 auxCommitmentHash;
    string auxCommitmentUri;
    bytes32 ndppCommitmentHash;
    string ndppCommitmentUri;
}
