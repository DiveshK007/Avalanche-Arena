// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ITeleporterMessenger.sol";

/**
 * @title CrossChainQuestSender
 * @notice Deployed on remote game L1s to send quest completion proofs to Arena chain.
 * @dev Uses TeleporterMessenger to send ICM messages to CrossChainQuestVerifier.
 *
 * Workflow:
 *   1. Game emits events (MatchWon, BossDefeated, etc.)
 *   2. Game or indexer calls reportQuestCompletion() on this contract
 *   3. This contract sends an ICM message via Teleporter to Arena chain
 *   4. CrossChainQuestVerifier on Arena chain processes the message
 *   5. Player gets rewarded on Arena chain
 */
contract CrossChainQuestSender is Ownable {

    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────

    address public constant TELEPORTER_MESSENGER = 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf;

    // ICM message types (must match CrossChainQuestVerifier)
    enum MessageType {
        QUEST_COMPLETION,
        REPUTATION_SYNC,
        GAME_REGISTRATION
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    /// @notice Arena chain blockchain ID (where CrossChainQuestVerifier lives)
    bytes32 public arenaChainID;

    /// @notice CrossChainQuestVerifier address on Arena chain
    address public arenaVerifierAddress;

    /// @notice This game's name
    string public gameName;

    /// @notice Whitelisted reporters: address => canReport
    mapping(address => bool) public approvedReporters;

    /// @notice Gas limit for cross-chain message delivery
    uint256 public requiredGasLimit = 500_000;

    /// @notice Total messages sent
    uint256 public messagesSent;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event QuestCompletionReported(
        address indexed player,
        uint256 indexed questId,
        bytes32 messageID
    );
    event ReputationSynced(
        address indexed player,
        uint256 xpEarned,
        bytes32 messageID
    );
    event GameRegistered(bytes32 messageID);
    event ReporterApproved(address indexed reporter);
    event ReporterRevoked(address indexed reporter);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyReporter() {
        require(
            approvedReporters[msg.sender] || msg.sender == owner(),
            "QuestSender: not authorized reporter"
        );
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(
        bytes32 _arenaChainID,
        address _arenaVerifierAddress,
        string memory _gameName
    ) Ownable(msg.sender) {
        arenaChainID = _arenaChainID;
        arenaVerifierAddress = _arenaVerifierAddress;
        gameName = _gameName;
    }

    // ──────────────────────────────────────────────
    //  Configuration
    // ──────────────────────────────────────────────

    function setArenaChain(bytes32 _chainID, address _verifier) external onlyOwner {
        arenaChainID = _chainID;
        arenaVerifierAddress = _verifier;
    }

    function setRequiredGasLimit(uint256 _gasLimit) external onlyOwner {
        requiredGasLimit = _gasLimit;
    }

    function approveReporter(address reporter) external onlyOwner {
        approvedReporters[reporter] = true;
        emit ReporterApproved(reporter);
    }

    function revokeReporter(address reporter) external onlyOwner {
        approvedReporters[reporter] = false;
        emit ReporterRevoked(reporter);
    }

    // ──────────────────────────────────────────────
    //  Core: Report Quest Completion
    // ──────────────────────────────────────────────

    /**
     * @notice Report a quest completion to Arena chain via ICM
     * @param player The player who completed the quest
     * @param questId The quest ID on Arena chain
     * @param gameTxHash The transaction hash of the game event
     */
    function reportQuestCompletion(
        address player,
        uint256 questId,
        bytes32 gameTxHash
    ) external onlyReporter returns (bytes32) {
        require(player != address(0), "QuestSender: zero player");
        require(arenaVerifierAddress != address(0), "QuestSender: arena not set");

        // Encode the quest proof
        bytes memory proof = abi.encode(
            player,
            questId,
            gameTxHash,
            block.timestamp,
            bytes32(block.chainid)
        );

        // Wrap with message type
        bytes memory message = abi.encode(MessageType.QUEST_COMPLETION, proof);

        // Send via Teleporter
        bytes32 messageID = ITeleporterMessenger(TELEPORTER_MESSENGER).sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: arenaChainID,
                destinationAddress: arenaVerifierAddress,
                feeInfo: TeleporterFeeInfo({
                    feeTokenAddress: address(0),
                    amount: 0
                }),
                requiredGasLimit: requiredGasLimit,
                allowedRelayerAddresses: new address[](0), // Allow any relayer
                message: message
            })
        );

        messagesSent++;
        emit QuestCompletionReported(player, questId, messageID);
        return messageID;
    }

    /**
     * @notice Sync accumulated reputation/XP to Arena chain
     * @param player The player to sync
     * @param xpEarned XP earned on this game chain
     * @param questsCompleted Number of quests completed on this chain
     */
    function syncReputation(
        address player,
        uint256 xpEarned,
        uint256 questsCompleted
    ) external onlyReporter returns (bytes32) {
        require(player != address(0), "QuestSender: zero player");

        bytes memory syncData = abi.encode(
            player,
            xpEarned,
            questsCompleted,
            bytes32(block.chainid)
        );

        bytes memory message = abi.encode(MessageType.REPUTATION_SYNC, syncData);

        bytes32 messageID = ITeleporterMessenger(TELEPORTER_MESSENGER).sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: arenaChainID,
                destinationAddress: arenaVerifierAddress,
                feeInfo: TeleporterFeeInfo({
                    feeTokenAddress: address(0),
                    amount: 0
                }),
                requiredGasLimit: requiredGasLimit,
                allowedRelayerAddresses: new address[](0),
                message: message
            })
        );

        messagesSent++;
        emit ReputationSynced(player, xpEarned, messageID);
        return messageID;
    }

    /**
     * @notice Register this game with the Arena chain
     */
    function registerWithArena() external onlyOwner returns (bytes32) {
        bytes memory registrationData = abi.encode(gameName);
        bytes memory message = abi.encode(MessageType.GAME_REGISTRATION, registrationData);

        bytes32 messageID = ITeleporterMessenger(TELEPORTER_MESSENGER).sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: arenaChainID,
                destinationAddress: arenaVerifierAddress,
                feeInfo: TeleporterFeeInfo({
                    feeTokenAddress: address(0),
                    amount: 0
                }),
                requiredGasLimit: 200_000,
                allowedRelayerAddresses: new address[](0),
                message: message
            })
        );

        messagesSent++;
        emit GameRegistered(messageID);
        return messageID;
    }
}
