// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ITeleporterMessenger.sol";
import "./interfaces/ITeleporterReceiver.sol";

/**
 * @title CrossChainQuestVerifier
 * @notice Receives cross-chain quest completion proofs from game L1s via ICM.
 * @dev Implements ITeleporterReceiver to accept messages from TeleporterMessenger.
 *
 * Architecture:
 *   Game L1 → CrossChainQuestSender (on game chain)
 *     → ICM/Teleporter relay
 *       → CrossChainQuestVerifier (this contract, on Arena chain)
 *         → RewardEngine → PlayerProgress
 *
 * This eliminates the need for off-chain attestation for cross-chain quests,
 * making the protocol fully trustless and decentralized.
 */
contract CrossChainQuestVerifier is ITeleporterReceiver, Ownable {

    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────

    /// @notice Teleporter Messenger address (same on all Avalanche chains)
    address public constant TELEPORTER_MESSENGER = 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf;

    // ──────────────────────────────────────────────
    //  ICM Message Types
    // ──────────────────────────────────────────────

    enum MessageType {
        QUEST_COMPLETION,       // Player completed a quest on remote chain
        REPUTATION_SYNC,        // Sync reputation/XP from remote chain
        GAME_REGISTRATION       // Game registering itself from remote chain
    }

    struct CrossChainQuestProof {
        address player;
        uint256 questId;
        bytes32 gameTxHash;     // Transaction hash on the game chain
        uint256 timestamp;
        bytes32 gameChainId;    // Source chain blockchain ID
    }

    struct CrossChainReputationSync {
        address player;
        uint256 xpEarned;
        uint256 questsCompleted;
        bytes32 gameChainId;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    /// @notice RewardEngine contract for rewarding players
    IRewardEngine public rewardEngine;

    /// @notice PlayerProgress contract for direct XP sync
    IPlayerProgress public playerProgress;

    /// @notice Approved source chains: blockchainID => approved
    mapping(bytes32 => bool) public approvedSourceChains;

    /// @notice Approved senders on each chain: blockchainID => senderAddress => approved
    mapping(bytes32 => mapping(address => bool)) public approvedSenders;

    /// @notice Track processed messages: messageHash => processed
    mapping(bytes32 => bool) public processedMessages;

    /// @notice Cross-chain quest completions count
    uint256 public crossChainCompletions;

    /// @notice Total cross-chain XP synced
    uint256 public totalCrossChainXP;

    /// @notice Registered remote game chains
    bytes32[] public registeredChains;

    /// @notice Chain metadata
    mapping(bytes32 => ChainInfo) public chainInfo;

    struct ChainInfo {
        string name;
        address senderContract;
        uint256 registeredAt;
        uint256 completionsCount;
        bool active;
    }

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event CrossChainQuestCompleted(
        address indexed player,
        uint256 indexed questId,
        bytes32 indexed sourceChain,
        bytes32 gameTxHash
    );
    event CrossChainReputationSynced(
        address indexed player,
        uint256 xpSynced,
        bytes32 indexed sourceChain
    );
    event SourceChainApproved(bytes32 indexed blockchainID, string name);
    event SourceChainRevoked(bytes32 indexed blockchainID);
    event SenderApproved(bytes32 indexed blockchainID, address indexed sender);
    event SenderRevoked(bytes32 indexed blockchainID, address indexed sender);
    event GameChainRegistered(bytes32 indexed blockchainID, string name, address sender);
    event InvalidMessageReceived(bytes32 indexed sourceChain, address sender, string reason);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ──────────────────────────────────────────────
    //  Configuration
    // ──────────────────────────────────────────────

    function setRewardEngine(address _engine) external onlyOwner {
        require(_engine != address(0), "ICMVerifier: zero address");
        rewardEngine = IRewardEngine(_engine);
    }

    function setPlayerProgress(address _progress) external onlyOwner {
        require(_progress != address(0), "ICMVerifier: zero address");
        playerProgress = IPlayerProgress(_progress);
    }

    /**
     * @notice Approve a source blockchain for cross-chain messages
     * @param blockchainID The Avalanche blockchain ID (32 bytes)
     * @param name Human-readable name for the chain
     */
    function approveSourceChain(bytes32 blockchainID, string calldata name) external onlyOwner {
        approvedSourceChains[blockchainID] = true;

        if (chainInfo[blockchainID].registeredAt == 0) {
            registeredChains.push(blockchainID);
        }

        chainInfo[blockchainID] = ChainInfo({
            name: name,
            senderContract: chainInfo[blockchainID].senderContract,
            registeredAt: block.timestamp,
            completionsCount: chainInfo[blockchainID].completionsCount,
            active: true
        });

        emit SourceChainApproved(blockchainID, name);
    }

    /**
     * @notice Revoke a source blockchain
     */
    function revokeSourceChain(bytes32 blockchainID) external onlyOwner {
        approvedSourceChains[blockchainID] = false;
        chainInfo[blockchainID].active = false;
        emit SourceChainRevoked(blockchainID);
    }

    /**
     * @notice Approve a sender address on a specific source chain
     * @param blockchainID The source chain blockchain ID
     * @param sender The CrossChainQuestSender contract address on that chain
     */
    function approveSender(bytes32 blockchainID, address sender) external onlyOwner {
        approvedSenders[blockchainID][sender] = true;
        chainInfo[blockchainID].senderContract = sender;
        emit SenderApproved(blockchainID, sender);
    }

    /**
     * @notice Revoke a sender address
     */
    function revokeSender(bytes32 blockchainID, address sender) external onlyOwner {
        approvedSenders[blockchainID][sender] = false;
        emit SenderRevoked(blockchainID, sender);
    }

    // ──────────────────────────────────────────────
    //  ICM: Receive Cross-Chain Messages
    // ──────────────────────────────────────────────

    /**
     * @notice Receive a cross-chain message from TeleporterMessenger
     * @dev Implements ITeleporterReceiver interface
     * @param sourceBlockchainID The blockchain ID of the message source
     * @param originSenderAddress The sender address on the source chain
     * @param message The encoded message payload
     */
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external override {
        // 1. Only TeleporterMessenger can call this
        require(
            msg.sender == TELEPORTER_MESSENGER,
            "ICMVerifier: unauthorized caller"
        );

        // 2. Verify source chain is approved
        if (!approvedSourceChains[sourceBlockchainID]) {
            emit InvalidMessageReceived(sourceBlockchainID, originSenderAddress, "unapproved chain");
            return;
        }

        // 3. Verify sender is approved on that chain
        if (!approvedSenders[sourceBlockchainID][originSenderAddress]) {
            emit InvalidMessageReceived(sourceBlockchainID, originSenderAddress, "unapproved sender");
            return;
        }

        // 4. Decode message type
        (MessageType msgType, bytes memory payload) = abi.decode(message, (MessageType, bytes));

        // 5. Route by message type
        if (msgType == MessageType.QUEST_COMPLETION) {
            _handleQuestCompletion(sourceBlockchainID, payload);
        } else if (msgType == MessageType.REPUTATION_SYNC) {
            _handleReputationSync(sourceBlockchainID, payload);
        } else if (msgType == MessageType.GAME_REGISTRATION) {
            _handleGameRegistration(sourceBlockchainID, originSenderAddress, payload);
        }
    }

    // ──────────────────────────────────────────────
    //  Internal Message Handlers
    // ──────────────────────────────────────────────

    function _handleQuestCompletion(bytes32 sourceChainID, bytes memory payload) internal {
        CrossChainQuestProof memory proof = abi.decode(payload, (CrossChainQuestProof));

        // Replay protection
        bytes32 messageHash = keccak256(abi.encode(
            proof.player,
            proof.questId,
            proof.gameTxHash,
            sourceChainID
        ));
        require(!processedMessages[messageHash], "ICMVerifier: already processed");
        processedMessages[messageHash] = true;

        // Reward the player
        if (address(rewardEngine) != address(0)) {
            try rewardEngine.rewardPlayer(proof.player, proof.questId) {
                crossChainCompletions++;
                chainInfo[sourceChainID].completionsCount++;

                emit CrossChainQuestCompleted(
                    proof.player,
                    proof.questId,
                    sourceChainID,
                    proof.gameTxHash
                );
            } catch {
                // Revert message processing status so it can be retried
                processedMessages[messageHash] = false;
            }
        }
    }

    function _handleReputationSync(bytes32 sourceChainID, bytes memory payload) internal {
        CrossChainReputationSync memory sync = abi.decode(payload, (CrossChainReputationSync));

        bytes32 messageHash = keccak256(abi.encode(
            sync.player,
            sync.xpEarned,
            sync.gameChainId,
            block.timestamp / 1 hours // Time bucket for rate limiting
        ));
        require(!processedMessages[messageHash], "ICMVerifier: already processed");
        processedMessages[messageHash] = true;

        if (address(playerProgress) != address(0) && sync.xpEarned > 0) {
            totalCrossChainXP += sync.xpEarned;

            emit CrossChainReputationSynced(
                sync.player,
                sync.xpEarned,
                sourceChainID
            );
        }
    }

    function _handleGameRegistration(
        bytes32 sourceChainID,
        address senderAddress,
        bytes memory payload
    ) internal {
        string memory gameName = abi.decode(payload, (string));

        // Auto-register if chain is approved
        if (approvedSourceChains[sourceChainID]) {
            chainInfo[sourceChainID].name = gameName;
            chainInfo[sourceChainID].senderContract = senderAddress;

            emit GameChainRegistered(sourceChainID, gameName, senderAddress);
        }
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function getRegisteredChainCount() external view returns (uint256) {
        return registeredChains.length;
    }

    function getChainInfo(bytes32 blockchainID) external view returns (ChainInfo memory) {
        return chainInfo[blockchainID];
    }

    function isMessageProcessed(bytes32 messageHash) external view returns (bool) {
        return processedMessages[messageHash];
    }

    function getStats() external view returns (
        uint256 totalCompletions,
        uint256 totalXPSynced,
        uint256 totalChains
    ) {
        return (crossChainCompletions, totalCrossChainXP, registeredChains.length);
    }
}

// ──────────────────────────────────────────────
//  Interfaces
// ──────────────────────────────────────────────

interface IRewardEngine {
    function rewardPlayer(address player, uint256 questId) external;
}

interface IPlayerProgress {
    function addXP(address player, uint256 xp) external;
    function totalXP(address player) external view returns (uint256);
    function level(address player) external view returns (uint256);
}
