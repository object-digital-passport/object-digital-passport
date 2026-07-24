// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ODPErrors.sol";

/**
 * Satellite: P-affiliation, mint-agent delegation, and creator publishing delegation.
 * Deploy after `ObjectDigitalPassport`; constructor takes the registry address.
 * The main registry may consult this contract for mint-agent and publishing-agent reads.
 */
interface IODPRegistryForRelations {
    struct CreatorRecord {
        string creatorId;
        address wallet;
        bytes1 typePrefix;
        uint256 timestamp;
    }

    function getCreatorByWallet(address wallet) external view returns (string memory);
    function getCreator(string calldata creatorId) external view returns (CreatorRecord memory);
}

contract ODPRegistryRelations {
    IODPRegistryForRelations public immutable odpRegistry;

    bytes1 private constant TYPE_P = "P";

    uint16 private constant MAX_P_ACTIVE_CHILDREN_PER_PARENT = 100;
    uint16 private constant MAX_P_PENDING_PARENTS_PER_CHILD = 100;

    mapping(bytes32 => bool) private _pendingPAffiliation;
    mapping(string => string) private _pParentOf;
    mapping(string => string[]) private _pChildrenOf;
    mapping(string => uint16) private _pActiveChildrenCountByParent;
    mapping(string => uint16) private _pPendingParentsCountByChild;
    mapping(string => uint256) private _pAffiliationJoinedAt;
    mapping(string => uint256) private _pAffiliationDetachedAt;
    mapping(string => string) private _pLastDetachedParent;

    struct DelegationInfo {
        address agent;
        uint256 expiresAt;
    }

    mapping(address => DelegationInfo) private _creatorPublishDelegation;
    mapping(string => address) private _mintAgentForCreator;
    mapping(bytes32 => bool) private _mintAgentDelegationPending;

    event MintAgentUpdate(string indexed principalCreatorId, address indexed agent, uint8 kind, uint256 timestamp);
    event PAffiliationProposed(string indexed parentPId, string indexed childPId, uint256 timestamp);
    event PAffiliationConfirmed(string indexed parentPId, string indexed childPId, uint256 timestamp);
    event PAffiliationDetached(string indexed parentPId, string indexed childPId, uint256 timestamp);
    event CreatorPublishingDelegated(address indexed creator, address indexed agent, uint256 expiresAt);
    event CreatorPublishingDelegationRevoked(address indexed creator, uint256 timestamp);

    constructor(address registry_) {
        odpRegistry = IODPRegistryForRelations(registry_);
    }

    function proposePAffiliation(string calldata parentPId) external {
        string memory childPId = _requireRegistered();
        _requireTypeP(childPId);
        if (!(bytes(parentPId).length > 0)) revert EC(49);
        if (!(keccak256(bytes(parentPId)) != keccak256(bytes(childPId)))) revert EC(46);
        _requireTypeP(parentPId);
        if (!(bytes(_pParentOf[childPId]).length == 0)) revert EC(45);
        if (!(_pPendingParentsCountByChild[childPId] < MAX_P_PENDING_PARENTS_PER_CHILD)) revert EC(48);

        // Triaged encodePacked collision: both IDs are validated registered P profiles with
        // the fixed contract-generated format P-NNN-NNN-NNN-NNN (17 chars) — fixed-length
        // concatenation is unambiguous. Next contract generation should use abi.encode.
        // slither-disable-next-line encode-packed-collision
        bytes32 k = keccak256(abi.encodePacked(parentPId, childPId));
        if (!(!_pendingPAffiliation[k])) revert EC(47);
        _pendingPAffiliation[k] = true;
        _pPendingParentsCountByChild[childPId] = _pPendingParentsCountByChild[childPId] + 1;

        emit PAffiliationProposed(parentPId, childPId, block.timestamp);
    }

    function confirmPAffiliation(string calldata childPId) external {
        string memory parentPId = _requireRegistered();
        _requireTypeP(parentPId);
        _requireTypeP(childPId);
        if (!(keccak256(bytes(parentPId)) != keccak256(bytes(childPId)))) revert EC(46);
        if (!(bytes(_pParentOf[childPId]).length == 0)) revert EC(45);

        // Triaged: fixed-format registered P IDs — see proposePAffiliation note.
        // slither-disable-next-line encode-packed-collision
        bytes32 k = keccak256(abi.encodePacked(parentPId, childPId));
        if (!(_pendingPAffiliation[k])) revert EC(42);
        delete _pendingPAffiliation[k];
        _pPendingParentsCountByChild[childPId] = _pPendingParentsCountByChild[childPId] - 1;

        if (!(_pActiveChildrenCountByParent[parentPId] < MAX_P_ACTIVE_CHILDREN_PER_PARENT)) revert EC(44);

        _pParentOf[childPId] = parentPId;
        _pChildrenOf[parentPId].push(childPId);
        _pActiveChildrenCountByParent[parentPId] = _pActiveChildrenCountByParent[parentPId] + 1;

        _pAffiliationJoinedAt[childPId] = block.timestamp;
        delete _pAffiliationDetachedAt[childPId];
        delete _pLastDetachedParent[childPId];

        emit PAffiliationConfirmed(parentPId, childPId, block.timestamp);
    }

    function detachPAffiliation(string calldata childPId) external {
        string memory parentPId = _requireRegistered();
        _requireTypeP(parentPId);
        _requireTypeP(childPId);
        if (!(keccak256(bytes(_pParentOf[childPId])) == keccak256(bytes(parentPId)))) revert EC(43);

        _removeChildFromParentList(parentPId, childPId);
        delete _pParentOf[childPId];
        _pActiveChildrenCountByParent[parentPId] = _pActiveChildrenCountByParent[parentPId] - 1;

        _pAffiliationDetachedAt[childPId] = block.timestamp;
        _pLastDetachedParent[childPId] = parentPId;

        emit PAffiliationDetached(parentPId, childPId, block.timestamp);
    }

    function getPAffiliationAudit(string calldata childPId)
        external
        view
        returns (
            string memory activeParent,
            uint256 joinedAt,
            uint256 detachedAt,
            string memory lastDetachedFromParent
        )
    {
        activeParent = _pParentOf[childPId];
        joinedAt = _pAffiliationJoinedAt[childPId];
        detachedAt = _pAffiliationDetachedAt[childPId];
        lastDetachedFromParent = _pLastDetachedParent[childPId];
    }

    function cancelPAffiliationRequest(string calldata parentPId) external {
        string memory childPId = _requireRegistered();
        _requireTypeP(childPId);
        // Triaged: fixed-format registered P IDs — see proposePAffiliation note.
        // slither-disable-next-line encode-packed-collision
        bytes32 k = keccak256(abi.encodePacked(parentPId, childPId));
        if (!(_pendingPAffiliation[k])) revert EC(42);
        delete _pendingPAffiliation[k];
        _pPendingParentsCountByChild[childPId] = _pPendingParentsCountByChild[childPId] - 1;
    }

    function isPAffiliationPending(string calldata parentPId, string calldata childPId)
        external
        view
        returns (bool)
    {
        // Triaged: view over the same fixed-format key space — see proposePAffiliation note.
        // slither-disable-next-line encode-packed-collision
        return _pendingPAffiliation[keccak256(abi.encodePacked(parentPId, childPId))];
    }

    function getPAffiliatedParent(string calldata childPId) external view returns (string memory) {
        return _pParentOf[childPId];
    }

    function getPAffiliatedChildren(string calldata parentPId) external view returns (string[] memory) {
        return _pChildrenOf[parentPId];
    }

    function getPAffiliatedChildrenPaged(string calldata parentPId, uint256 offset, uint256 limit)
        external
        view
        returns (string[] memory result, uint256 total)
    {
        return _stringArraySlice(_pChildrenOf[parentPId], offset, limit);
    }

    function requestMintAgentRole(string calldata principalCreatorId) external {
        if (!(bytes(principalCreatorId).length > 0)) revert EC(76);
        IODPRegistryForRelations.CreatorRecord memory cr = odpRegistry.getCreator(principalCreatorId);
        if (!(msg.sender != cr.wallet)) revert EC(75);
        if (_mintAgentForCreator[principalCreatorId] == msg.sender) {
            return;
        }
        bytes32 k = keccak256(abi.encodePacked(principalCreatorId, msg.sender));
        if (!(!_mintAgentDelegationPending[k])) revert EC(74);
        _mintAgentDelegationPending[k] = true;
        emit MintAgentUpdate(principalCreatorId, msg.sender, 0, block.timestamp);
    }

    function confirmMintAgentRole(address agent) external {
        if (!(agent != address(0))) revert EC(21);
        string memory creatorId = _requireRegistered();
        bytes32 k = keccak256(abi.encodePacked(creatorId, agent));
        if (!(_mintAgentDelegationPending[k])) revert EC(73);
        delete _mintAgentDelegationPending[k];
        address prev = _mintAgentForCreator[creatorId];
        _mintAgentForCreator[creatorId] = agent;
        if (prev != address(0) && prev != agent) {
            emit MintAgentUpdate(creatorId, prev, 3, block.timestamp);
        }
        emit MintAgentUpdate(creatorId, agent, 2, block.timestamp);
    }

    function revokeMintAgentRole() external {
        string memory creatorId = _requireRegistered();
        address prev = _mintAgentForCreator[creatorId];
        if (!(prev != address(0))) revert EC(79);
        delete _mintAgentForCreator[creatorId];
        emit MintAgentUpdate(creatorId, prev, 3, block.timestamp);
    }

    function renounceMintAgentRole(string calldata principalCreatorId) external {
        if (!(bytes(principalCreatorId).length > 0)) revert EC(76);
        odpRegistry.getCreator(principalCreatorId);
        if (!(_mintAgentForCreator[principalCreatorId] == msg.sender)) revert EC(72);
        delete _mintAgentForCreator[principalCreatorId];
        emit MintAgentUpdate(principalCreatorId, msg.sender, 3, block.timestamp);
    }

    function cancelMintAgentRequest(string calldata principalCreatorId) external {
        if (!(bytes(principalCreatorId).length > 0)) revert EC(76);
        bytes32 k = keccak256(abi.encodePacked(principalCreatorId, msg.sender));
        if (!(_mintAgentDelegationPending[k])) revert EC(73);
        delete _mintAgentDelegationPending[k];
        emit MintAgentUpdate(principalCreatorId, msg.sender, 1, block.timestamp);
    }

    function mintAgentForCreator(string calldata creatorId) external view returns (address) {
        return _mintAgentForCreator[creatorId];
    }

    function mintAgentDelegationPending(bytes32 key) external view returns (bool) {
        return _mintAgentDelegationPending[key];
    }

    function delegateCreatorPublishing(address agent, uint256 expiresAt) external {
        if (!(agent != address(0))) revert EC(21);
        _requireRegistered();
        if (!(expiresAt > block.timestamp)) revert EC(20);
        _creatorPublishDelegation[msg.sender] = DelegationInfo({agent: agent, expiresAt: expiresAt});
        emit CreatorPublishingDelegated(msg.sender, agent, expiresAt);
    }

    function revokeCreatorPublishing() external {
        _requireRegistered();
        delete _creatorPublishDelegation[msg.sender];
        emit CreatorPublishingDelegationRevoked(msg.sender, block.timestamp);
    }

    function getCreatorPublishingDelegation(address creatorWallet)
        external
        view
        returns (address agent, uint256 expiresAt)
    {
        DelegationInfo storage d = _creatorPublishDelegation[creatorWallet];
        return (d.agent, d.expiresAt);
    }

    function _requireRegistered() internal view returns (string memory creatorId) {
        creatorId = odpRegistry.getCreatorByWallet(msg.sender);
        if (!(bytes(creatorId).length > 0)) revert EC(3);
    }

    function _requireTypeP(string memory creatorId) internal view {
        IODPRegistryForRelations.CreatorRecord memory c = odpRegistry.getCreator(creatorId);
        if (!(c.typePrefix == TYPE_P)) revert EC(71);
    }

    function _removeChildFromParentList(string memory parentPId, string memory childPId) internal {
        string[] storage ch = _pChildrenOf[parentPId];
        for (uint256 i = 0; i < ch.length; i++) {
            if (keccak256(bytes(ch[i])) == keccak256(bytes(childPId))) {
                ch[i] = ch[ch.length - 1];
                ch.pop();
                return;
            }
        }
        revert EC(63);
    }

    function _stringArraySlice(string[] storage arr, uint256 offset, uint256 limit)
        internal
        view
        returns (string[] memory result, uint256 total)
    {
        total = arr.length;
        if (offset >= total) {
            return (new string[](0), total);
        }
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        uint256 n = end - offset;
        result = new string[](n);
        for (uint256 i = 0; i < n; i++) {
            result[i] = arr[offset + i];
        }
    }
}
