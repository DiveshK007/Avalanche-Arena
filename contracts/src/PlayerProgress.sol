// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PlayerProgress
 * @notice Tracks wallet-level progression: XP, level, quest completions, streaks.
 * @dev Only the RewardEngine contract can mutate player state.
 *
 * Level formula: level = sqrt(totalXP / SCALING_FACTOR)
 * Streak logic: consecutive quest completions within STREAK_WINDOW boost multiplier.
 */
contract PlayerProgress is Ownable {

    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────

    uint256 public constant SCALING_FACTOR = 100;
    uint256 public constant STREAK_WINDOW = 7 days;

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    mapping(address => uint256) public totalXP;
    mapping(address => uint256) public level;
    mapping(address => uint256) public questsCompleted;
    mapping(address => uint256) public streak;
    mapping(address => uint256) public lastQuestTime;

    // Quest completion tracking
    mapping(address => mapping(uint256 => bool)) public questCompleted;
    mapping(address => mapping(uint256 => uint256)) public lastCompletionTime;

    // Authorized engine
    address public rewardEngine;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event XPAdded(address indexed player, uint256 amount, uint256 newTotal);
    event LevelUp(address indexed player, uint256 newLevel);
    event QuestCompleted(address indexed player, uint256 indexed questId);
    event StreakUpdated(address indexed player, uint256 streak);
    event RewardEngineSet(address indexed engine);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyRewardEngine() {
        require(msg.sender == rewardEngine, "PlayerProgress: not reward engine");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ──────────────────────────────────────────────
    //  Configuration
    // ──────────────────────────────────────────────

    function setRewardEngine(address _engine) external onlyOwner {
        require(_engine != address(0), "PlayerProgress: zero address");
        rewardEngine = _engine;
        emit RewardEngineSet(_engine);
    }

    // ──────────────────────────────────────────────
    //  Core Functions (Only RewardEngine)
    // ──────────────────────────────────────────────

    /**
     * @notice Add XP to a player and recalculate level
     * @param player The player's wallet address
     * @param xp Amount of XP to add
     */
    function addXP(address player, uint256 xp) external onlyRewardEngine {
        totalXP[player] += xp;

        uint256 newLevel = calculateLevel(totalXP[player]);

        if (newLevel > level[player]) {
            level[player] = newLevel;
            emit LevelUp(player, newLevel);
        }

        // Update streak
        if (block.timestamp - lastQuestTime[player] <= STREAK_WINDOW) {
            streak[player]++;
        } else {
            streak[player] = 1;
        }
        lastQuestTime[player] = block.timestamp;

        emit XPAdded(player, xp, totalXP[player]);
        emit StreakUpdated(player, streak[player]);
    }

    /**
     * @notice Mark a quest as completed for a player
     * @param player The player's wallet address
     * @param questId The quest identifier
     */
    function markQuestCompleted(address player, uint256 questId) external onlyRewardEngine {
        questCompleted[player][questId] = true;
        lastCompletionTime[player][questId] = block.timestamp;
        questsCompleted[player]++;
        emit QuestCompleted(player, questId);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function hasCompletedQuest(address player, uint256 questId) external view returns (bool) {
        return questCompleted[player][questId];
    }

    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 xp,
            uint256 playerLevel,
            uint256 completed,
            uint256 playerStreak
        )
    {
        return (
            totalXP[player],
            level[player],
            questsCompleted[player],
            streak[player]
        );
    }

    function calculateLevel(uint256 xp) public pure returns (uint256) {
        return sqrt(xp / SCALING_FACTOR);
    }

    // ──────────────────────────────────────────────
    //  Internal
    // ──────────────────────────────────────────────

    /**
     * @notice Integer square root (Babylonian method)
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
