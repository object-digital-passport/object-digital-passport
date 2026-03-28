// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IODPExtension } from "../ObjectDigitalPassport.sol";

/// @dev Test / reference `IODPExtension`: `payload` is already `abi.encode` of the 13-tuple expected by
///      `ObjectDigitalPassport.mintDigitalViaExtension` after `normalize` (digital fields + aux pair).
contract ODPPassThroughDigitalExtension is IODPExtension {
    error InvalidPayload();

    function validate(bytes calldata payload) external pure {
        if (payload.length == 0) revert InvalidPayload();
        abi.decode(
            payload,
            (uint32, uint8, bytes32, string, bytes32, string, bytes32, string, bytes32, string, bytes32, bytes32, string)
        );
    }

    function normalize(bytes calldata payload) external pure returns (bytes memory) {
        return bytes(payload);
    }
}
