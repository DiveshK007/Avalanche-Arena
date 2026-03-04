// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITeleporterReceiver
 * @notice Interface that contracts must implement to receive ICM messages.
 * @dev Called by TeleporterMessenger on the destination chain.
 */
interface ITeleporterReceiver {
    /**
     * @notice Called by TeleporterMessenger when a cross-chain message arrives.
     * @param sourceBlockchainID The blockchain ID of the source chain.
     * @param originSenderAddress The address of the sender on the source chain.
     * @param message The raw message payload.
     */
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external;
}
