// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ODPErrors.sol";

/**
 * Satellite: edition unit keys and activation — SPEC 0.7 §20.
 *
 * An edition passport registers one Merkle root covering every unit key of a production
 * run, so 100 000 units cost 32 bytes on-chain. Each physical unit carries a keypair whose
 * seed is printed under a tamper-evident layer; presenting a signature from that key
 * records a one-time, public, timestamped activation.
 *
 * Deployed after `ObjectDigitalPassport`; the constructor pins one registry. Governance
 * must then point the registry at this satellite via `setEditionUnits`, which is what lets
 * the first activation close that edition's revocation window (§20.13).
 *
 * Deliberately NOT here: any judgement. A duplicate activation reverts, competing records
 * are surfaced rather than ranked, and nothing in this contract marks a unit as fake.
 */
interface IODPRegistryForUnits {
    /// @dev ABI must match `CreatorRecord` field order on `ObjectDigitalPassport.getCreator`.
    struct CreatorRecord {
        string creatorId;
        address wallet;
        bytes1 typePrefix;
        uint256 timestamp;
    }

    /// @dev ABI must match `PassportHeaderView` field order on `ObjectDigitalPassport`.
    struct PassportHeaderView {
        string passportId;
        uint8 contractVersion;
        address creator;
        address owner;
        string creatorId;
        uint32 year;
        uint8 month;
        string title;
        string authorName;
        string shortDescription;
        string domain;
        string objectType;
    }

    function getPassportHeader(string calldata passportId) external view returns (PassportHeaderView memory);
    function getCreator(string calldata creatorId) external view returns (CreatorRecord memory);
    function lockEditionRevocation(string calldata passportId) external;
}

contract ODPEditionUnits {
    bytes1 private constant TYPE_B = "B";

    /// Bounds a proof to a tree of 2^32 leaves — the `unitCount` ceiling.
    uint256 private constant MAX_PROOF = 32;

    IODPRegistryForUnits public immutable odpRegistry;

    struct Edition {
        bytes32 merkleRoot;
        uint32 unitCount;
        bool open;
        bool windowClosed; // revocation window already locked on the registry
    }

    struct Activation {
        uint64 timestamp;
        address unitAddress;
    }

    mapping(string => Edition) private _editions;
    mapping(bytes32 => Activation) private _activations;

    event EditionOpened(string editionPassportId, bytes32 merkleRoot, uint32 unitCount, address indexed issuer);
    event UnitActivated(string editionPassportId, uint32 indexed unitIndex, address indexed unitAddress, uint256 timestamp);

    constructor(address registry_) {
        odpRegistry = IODPRegistryForUnits(registry_);
    }

    // ─── Issuer surface ───────────────────────────────────────────────────────

    /**
     * SPEC §20.3 — register the unit-key set of an edition.
     *
     * The root has to exist on-chain as a plain value: `anchorsHash` commits the whole
     * anchors array as one hash, which no contract can verify a proof against. Off-chain
     * verifiers compare this root with the `unit_key_set` anchor; a mismatch is a tampered
     * or misconfigured edition.
     *
     * `B` profiles only (§20.1), and only the edition's own creator. Write-once: a second
     * production run is a second edition passport with its own key set.
     */
    function openEdition(
        string calldata editionPassportId,
        bytes32 merkleRoot,
        uint32 unitCount
    ) external {
        if (_editions[editionPassportId].open) revert EC(119);
        if (!(merkleRoot != bytes32(0))) revert EC(118);
        if (!(unitCount > 0)) revert EC(122);

        IODPRegistryForUnits.PassportHeaderView memory h = odpRegistry.getPassportHeader(editionPassportId);
        if (!(msg.sender == h.creator)) revert EC(120);
        if (!(odpRegistry.getCreator(h.creatorId).typePrefix == TYPE_B)) revert EC(121);

        _editions[editionPassportId] = Edition({
            merkleRoot: merkleRoot,
            unitCount: unitCount,
            open: true,
            windowClosed: false
        });

        emit EditionOpened(editionPassportId, merkleRoot, unitCount, msg.sender);
    }

    // ─── Activation ───────────────────────────────────────────────────────────

    /**
     * SPEC §20.9 — record the first use of a unit key.
     *
     * Permissionless: the signature is authenticated, `msg.sender` is not. Whoever submits
     * is a courier and gains nothing, so any relayer — an issuer's paymaster, a marketplace,
     * any ODP-aware app, or the holder's own wallet — can carry it, and a signature may be
     * produced offline and published years later.
     *
     * A duplicate reverts rather than succeeding as a no-op. That is a spam defence: a no-op
     * would let anyone replay one valid signature indefinitely and drain whoever pays the
     * fee, while a revert fails in simulation before any money moves.
     */
    function activate(
        string calldata editionPassportId,
        uint32 unitIndex,
        bytes32[] calldata proof,
        bytes calldata signature
    ) external {
        Edition storage ed = _editions[editionPassportId];
        if (!ed.open) revert EC(118);
        if (!(unitIndex < ed.unitCount)) revert EC(122);

        bytes32 slot = _slot(editionPassportId, unitIndex);
        if (_activations[slot].timestamp != 0) revert EC(124);

        address unitAddress = _recoverUnitAddress(editionPassportId, unitIndex, signature);
        if (!_proves(ed.merkleRoot, proof, unitIndex, unitAddress)) revert EC(123);

        _activations[slot] = Activation({ timestamp: uint64(block.timestamp), unitAddress: unitAddress });

        // §20.13 — the first activation of any unit closes the edition's revocation window.
        if (!ed.windowClosed) {
            ed.windowClosed = true;
            odpRegistry.lockEditionRevocation(editionPassportId);
        }

        emit UnitActivated(editionPassportId, unitIndex, unitAddress, block.timestamp);
    }

    // ─── Reads ────────────────────────────────────────────────────────────────

    function getEdition(string calldata editionPassportId)
        external view returns (bytes32 merkleRoot, uint32 unitCount, bool open, bool windowClosed)
    {
        Edition storage ed = _editions[editionPassportId];
        return (ed.merkleRoot, ed.unitCount, ed.open, ed.windowClosed);
    }

    /// Returns `(0, address(0))` when the unit has never been activated.
    function getActivation(string calldata editionPassportId, uint32 unitIndex)
        external view returns (uint256 timestamp, address unitAddress)
    {
        Activation storage a = _activations[_slot(editionPassportId, unitIndex)];
        return (a.timestamp, a.unitAddress);
    }

    function isActivated(string calldata editionPassportId, uint32 unitIndex) external view returns (bool) {
        return _activations[_slot(editionPassportId, unitIndex)].timestamp != 0;
    }

    /// The message a unit key signs (§20.9), exposed so wallets and tools agree byte-for-byte.
    function activationPayloadHash(string calldata editionPassportId, uint32 unitIndex)
        public view returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                "ODP-UNIT-ACTIVATE-v1",
                uint256(block.chainid),
                address(this),
                editionPassportId,
                unitIndex
            )
        );
    }

    /// SPEC §20.3 leaf: `SHA-256( uint32be(index) || address20 )`.
    function unitLeaf(uint32 unitIndex, address unitAddress) public pure returns (bytes32) {
        return sha256(abi.encodePacked(unitIndex, unitAddress));
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    function _slot(string calldata editionPassportId, uint32 unitIndex) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(editionPassportId, unitIndex));
    }

    function _recoverUnitAddress(
        string calldata editionPassportId,
        uint32 unitIndex,
        bytes calldata signature
    ) private view returns (address) {
        if (!(signature.length == 65)) revert EC(125);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        // EIP-2 low-s; rejects the trivially malleable half of the curve.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) revert EC(125);
        if (v < 27) v += 27;
        if (!(v == 27 || v == 28)) revert EC(125);

        bytes32 digest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", activationPayloadHash(editionPassportId, unitIndex))
        );
        address signer = ecrecover(digest, v, r, s);
        if (!(signer != address(0))) revert EC(125);
        return signer;
    }

    /**
     * SPEC §20.3 tree: interior node = `SHA-256(left || right)`, last node duplicated on an
     * odd level. Direction is taken from the index rather than from flags in the proof, so a
     * proof carries only siblings and cannot claim a position it does not have.
     */
    function _proves(
        bytes32 root,
        bytes32[] calldata proof,
        uint32 unitIndex,
        address unitAddress
    ) private pure returns (bool) {
        if (proof.length > MAX_PROOF) revert EC(127);
        bytes32 node = unitLeaf(unitIndex, unitAddress);
        uint256 idx = unitIndex;
        for (uint256 i = 0; i < proof.length; i++) {
            node = (idx & 1 == 0)
                ? sha256(abi.encodePacked(node, proof[i]))
                : sha256(abi.encodePacked(proof[i], node));
            idx >>= 1;
        }
        return node == root;
    }
}
