// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IChainlinkVRF
 * @notice Simplified Chainlink VRF V2.5 interfaces for Avalanche.
 * @dev Avalanche Fuji VRF Coordinator: 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE
 */

interface IVRFCoordinatorV2Plus {
    function requestRandomWords(
        bytes32 keyHash,
        uint256 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}

abstract contract VRFConsumerBaseV2Plus {
    error OnlyCoordinator(address have, address want);

    address private immutable vrfCoordinator;

    constructor(address _vrfCoordinator) {
        vrfCoordinator = _vrfCoordinator;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal virtual;

    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        if (msg.sender != vrfCoordinator) {
            revert OnlyCoordinator(msg.sender, vrfCoordinator);
        }
        fulfillRandomWords(requestId, randomWords);
    }
}
