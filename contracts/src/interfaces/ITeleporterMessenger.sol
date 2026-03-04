// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITeleporterMessenger
 * @notice Interface for Avalanche ICM (Interchain Messaging) via Teleporter.
 * @dev Deployed at 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf on all chains.
 */

struct TeleporterMessageInput {
    bytes32 destinationBlockchainID;
    address destinationAddress;
    TeleporterFeeInfo feeInfo;
    uint256 requiredGasLimit;
    address[] allowedRelayerAddresses;
    bytes message;
}

struct TeleporterFeeInfo {
    address feeTokenAddress;
    uint256 amount;
}

struct TeleporterMessage {
    uint256 messageNonce;
    address originSenderAddress;
    bytes32 destinationBlockchainID;
    address destinationAddress;
    uint256 requiredGasLimit;
    address[] allowedRelayerAddresses;
    TeleporterReceipt[] receipts;
    bytes message;
}

struct TeleporterReceipt {
    uint256 receivedMessageNonce;
    address relayerRewardAddress;
}

interface ITeleporterMessenger {
    function sendCrossChainMessage(
        TeleporterMessageInput calldata messageInput
    ) external returns (bytes32);

    function receiveCrossChainMessage(
        uint256 messageIndex,
        address relayerRewardAddress
    ) external;

    function retryMessageExecution(
        bytes32 sourceBlockchainID,
        TeleporterMessage calldata message
    ) external;

    function retrySendCrossChainMessage(
        TeleporterMessage calldata message
    ) external;

    function addFeeAmount(
        bytes32 messageID,
        address feeTokenAddress,
        uint256 additionalFeeAmount
    ) external;

    function getMessageHash(
        bytes32 messageID
    ) external view returns (bytes32);

    function messageReceived(
        bytes32 messageID
    ) external view returns (bool);

    function getRelayerRewardAddress(
        bytes32 messageID
    ) external view returns (address);

    function getNextMessageID(
        bytes32 destinationBlockchainID
    ) external view returns (bytes32);

    function receivedFailedMessageExecution(
        bytes32 messageID
    ) external view returns (bool);
}
