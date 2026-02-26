// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title QuestRegistry
 * @notice Stores all quest definitions published by Arena or partner games.
 * @dev Source of truth for quest metadata. Only whitelisted publishers can create quests.
 *
 * Each quest maps to:
 *   - A target game contract address
 *   - An event signature to watch
 *   - XP reward weight
 *   - Difficulty rating
 *   - Cooldown between completions
 */
contract QuestRegistry is Ownable {

    // ──────────────────────────────────────────────
    //  Data Structures
    // ──────────────────────────────────────────────

    struct Quest {
        address targetContract;   // Partner game contract
        bytes32 eventSig;         // keccak256 of event signature
        uint256 xpReward;         // XP granted on completion
        uint8   difficulty;       // 1-5 difficulty rating
        uint256 cooldown;         // Seconds between repeat completions
        bool    active;           // Whether quest is currently live
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    uint256 public questCount;
    mapping(uint256 => Quest) public quests;
    mapping(address => bool) public whitelistedPublishers;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event QuestCreated(uint256 indexed questId, address indexed targetContract, uint256 xpReward);
    event QuestUpdated(uint256 indexed questId);
    event QuestDeactivated(uint256 indexed questId);
    event PublisherWhitelisted(address indexed publisher);
    event PublisherRemoved(address indexed publisher);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyPublisher() {
        require(
            msg.sender == owner() || whitelistedPublishers[msg.sender],
            "QuestRegistry: not authorized publisher"
        );
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ──────────────────────────────────────────────
    //  Publisher Management
    // ──────────────────────────────────────────────

    function addPublisher(address publisher) external onlyOwner {
        whitelistedPublishers[publisher] = true;
        emit PublisherWhitelisted(publisher);
    }

    function removePublisher(address publisher) external onlyOwner {
        whitelistedPublishers[publisher] = false;
        emit PublisherRemoved(publisher);
    }

    // ──────────────────────────────────────────────
    //  Quest Management
    // ──────────────────────────────────────────────

    /**
     * @notice Create a new quest definition
     * @param targetContract The game contract that emits the event
     * @param eventSig keccak256 hash of the event signature
     * @param xpReward XP awarded on quest completion
     * @param difficulty Difficulty level (1-5)
     * @param cooldown Minimum seconds between repeat completions per player
     * @return questId The ID of the newly created quest
     */
    function createQuest(
        address targetContract,
        bytes32 eventSig,
        uint256 xpReward,
        uint8   difficulty,
        uint256 cooldown
    ) external onlyPublisher returns (uint256) {
        require(targetContract != address(0), "QuestRegistry: zero address");
        require(xpReward > 0, "QuestRegistry: zero xp");
        require(difficulty >= 1 && difficulty <= 5, "QuestRegistry: invalid difficulty");

        questCount++;

        quests[questCount] = Quest({
            targetContract: targetContract,
            eventSig: eventSig,
            xpReward: xpReward,
            difficulty: difficulty,
            cooldown: cooldown,
            active: true
        });

        emit QuestCreated(questCount, targetContract, xpReward);
        return questCount;
    }

    /**
     * @notice Update an existing quest's parameters
     */
    function updateQuest(
        uint256 questId,
        uint256 xpReward,
        uint256 cooldown,
        bool    active
    ) external onlyOwner {
        require(questId > 0 && questId <= questCount, "QuestRegistry: invalid quest");

        Quest storage quest = quests[questId];
        quest.xpReward = xpReward;
        quest.cooldown = cooldown;
        quest.active = active;

        emit QuestUpdated(questId);
    }

    /**
     * @notice Deactivate a quest
     */
    function deactivateQuest(uint256 questId) external onlyOwner {
        require(questId > 0 && questId <= questCount, "QuestRegistry: invalid quest");
        quests[questId].active = false;
        emit QuestDeactivated(questId);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function getQuest(uint256 questId) external view returns (Quest memory) {
        require(questId > 0 && questId <= questCount, "QuestRegistry: invalid quest");
        return quests[questId];
    }

    function isQuestActive(uint256 questId) external view returns (bool) {
        return quests[questId].active;
    }
}
