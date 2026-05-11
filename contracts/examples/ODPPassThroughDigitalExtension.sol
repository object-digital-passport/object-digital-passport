// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IODPExtension } from "../IODPExtension.sol";
import { DigitalMintInputs } from "../ODPPassportTypes.sol";

/// @dev Test / reference `IODPExtension`: `payload` is already `abi.encode` of the full v0.5 tuple expected by
///      `ObjectDigitalPassport.mintDigitalViaExtension` after `normalize`.
contract ODPPassThroughDigitalExtension is IODPExtension {
    error InvalidPayload();

    function validate(bytes calldata payload) external pure {
        if (payload.length == 0) revert InvalidPayload();
        abi.decode(payload, (DigitalMintInputs));
    }

    function normalize(bytes calldata payload) external pure returns (bytes memory) {
        return bytes(payload);
    }
}
