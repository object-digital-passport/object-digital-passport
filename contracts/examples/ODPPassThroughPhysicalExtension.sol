// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IODPExtension } from "../ObjectDigitalPassport.sol";

/// @dev Test / reference `IODPExtension`: `payload` is already `abi.encode` of the 17-tuple expected by
///      `ObjectDigitalPassport.mintPhysicalViaExtension` after `normalize` (same layout as core decode).
contract ODPPassThroughPhysicalExtension is IODPExtension {
    error InvalidPayload();

    function validate(bytes calldata payload) external pure {
        if (payload.length == 0) revert InvalidPayload();
        abi.decode(
            payload,
            (
                uint32,
                uint8,
                uint8,
                bytes32,
                string,
                bytes32,
                string,
                uint8,
                bytes32,
                bytes,
                string,
                bytes32,
                string,
                bytes32,
                string,
                bytes32,
                string
            )
        );
    }

    function normalize(bytes calldata payload) external pure returns (bytes memory) {
        return bytes(payload);
    }
}
