// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IChainlinkVRF.sol";

/**
 * @title ArenaRandomRewards
 * @notice Uses Chainlink VRF to generate provably random bonus rewards.
 * @dev Integrates with Chainlink VRF V2.5 on Avalanche for:
 *   - Random bonus XP multipliers (1x-5x)
 *   - Loot box / mystery reward rolls
 *   - Random quest selection for daily challenges
 *   - Tournament bracket seeding
 *
 * Chainlink VRF on Avalanche Fuji:
 *   Coordinator: 0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE
 *   Key Hash: 0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887
 */
contract ArenaRandomRewards is VRFConsumerBaseV2Plus, Ownable {

    // ──────────────────────────────────────────────
    //  Chainlink VRF Config
    // ──────────────────────────────────────────────

    IVRFCoordinatorV2Plus public coordinator;
    bytes32 public keyHash;
    uint256 public subscriptionId;
    uint16 public requestConfirmations = 3;
    uint32 public callbackGasLimit = 200_000;

    // ──────────────────────────────────────────────
    //  Reward Types
    // ──────────────────────────────────────────────

    enum RewardType {
        BONUS_XP_MULTIPLIER,    // Random 1x-5x XP multiplier
        MYSTERY_REWARD,         // Random reward tier
        DAILY_QUEST_SELECTION,  // Random quest of the day
        TOURNAMENT_SEED         // Random bracket placement
    }

    struct PendingReward {
        address player;
        RewardType rewardType;
        uint256 baseValue;      // Base XP or quest count
        bool fulfilled;
        uint256 randomResult;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    mapping(uint256 => PendingReward) public pendingRewards;
    mapping(address => uint256[]) public playerRewardHistory;

    /// @notice RewardEngine contract
    address public rewardEngine;

    /// @notice Quest count for daily quest selection
    uint256 public totalQuestCount;

    /// @notice XP bonus multiplier tiers [100, 150, 200, 300, 500] = [1x, 1.5x, 2x, 3x, 5x]
    uint256[] public bonusMultipliers;

    /// @notice Mystery reward tiers (XP amounts)
    uint256[] public mysteryRewardTiers;

    /// @notice Total random rewards fulfilled
    uint256 public totalRewardsFulfilled;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event RandomRewardRequested(
        uint256 indexed requestId,
        address indexed player,
        RewardType rewardType
    );
    event RandomRewardFulfilled(
        uint256 indexed requestId,
        address indexed player,
        RewardType rewardType,
        uint256 result
    );
    event BonusXPAwarded(address indexed player, uint256 baseXP, uint256 multiplier, uint256 totalXP);
    event MysteryRewardAwarded(address indexed player, uint256 rewardTier, uint256 xpAmount);
    event DailyQuestSelected(uint256 questId);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subscriptionId
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) Ownable(msg.sender) {
        coordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;

        // Default bonus multipliers: 1x(40%), 1.5x(25%), 2x(20%), 3x(10%), 5x(5%)
        bonusMultipliers.push(100);  // 1.0x
        bonusMultipliers.push(150);  // 1.5x
        bonusMultipliers.push(200);  // 2.0x
        bonusMultipliers.push(300);  // 3.0x
        bonusMultipliers.push(500);  // 5.0x

        // Default mystery reward tiers (XP)
        mysteryRewardTiers.push(50);
        mysteryRewardTiers.push(100);
        mysteryRewardTiers.push(250);
        mysteryRewardTiers.push(500);
        mysteryRewardTiers.push(1000);
    }

    // ──────────────────────────────────────────────
    //  Configuration
    // ──────────────────────────────────────────────

    function setRewardEngine(address _engine) external onlyOwner {
        rewardEngine = _engine;
    }

    function setTotalQuestCount(uint256 _count) external onlyOwner {
        totalQuestCount = _count;
    }

    function setVRFConfig(
        bytes32 _keyHash,
        uint256 _subscriptionId,
        uint16 _confirmations,
        uint32 _gasLimit
    ) external onlyOwner {
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        requestConfirmations = _confirmations;
        callbackGasLimit = _gasLimit;
    }

    function setBonusMultipliers(uint256[] calldata _multipliers) external onlyOwner {
        delete bonusMultipliers;
        for (uint256 i = 0; i < _multipliers.length; i++) {
            bonusMultipliers.push(_multipliers[i]);
        }
    }

    function setMysteryRewardTiers(uint256[] calldata _tiers) external onlyOwner {
        delete mysteryRewardTiers;
        for (uint256 i = 0; i < _tiers.length; i++) {
            mysteryRewardTiers.push(_tiers[i]);
        }
    }

    // ──────────────────────────────────────────────
    //  Request Random Rewards
    // ──────────────────────────────────────────────

    /**
     * @notice Request a random bonus XP multiplier for a player
     * @param player The player to reward
     * @param baseXP The base XP amount before multiplier
     */
    function requestBonusXP(address player, uint256 baseXP) external returns (uint256) {
        require(msg.sender == rewardEngine || msg.sender == owner(), "RandomRewards: unauthorized");

        uint256 requestId = coordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1
        );

        pendingRewards[requestId] = PendingReward({
            player: player,
            rewardType: RewardType.BONUS_XP_MULTIPLIER,
            baseValue: baseXP,
            fulfilled: false,
            randomResult: 0
        });

        playerRewardHistory[player].push(requestId);
        emit RandomRewardRequested(requestId, player, RewardType.BONUS_XP_MULTIPLIER);
        return requestId;
    }

    /**
     * @notice Request a mystery reward box
     * @param player The player who opened the box
     */
    function requestMysteryReward(address player) external returns (uint256) {
        require(msg.sender == rewardEngine || msg.sender == owner(), "RandomRewards: unauthorized");

        uint256 requestId = coordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1
        );

        pendingRewards[requestId] = PendingReward({
            player: player,
            rewardType: RewardType.MYSTERY_REWARD,
            baseValue: 0,
            fulfilled: false,
            randomResult: 0
        });

        playerRewardHistory[player].push(requestId);
        emit RandomRewardRequested(requestId, player, RewardType.MYSTERY_REWARD);
        return requestId;
    }

    /**
     * @notice Request random daily quest selection
     */
    function requestDailyQuest() external onlyOwner returns (uint256) {
        require(totalQuestCount > 0, "RandomRewards: no quests");

        uint256 requestId = coordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1
        );

        pendingRewards[requestId] = PendingReward({
            player: address(0),
            rewardType: RewardType.DAILY_QUEST_SELECTION,
            baseValue: totalQuestCount,
            fulfilled: false,
            randomResult: 0
        });

        emit RandomRewardRequested(requestId, address(0), RewardType.DAILY_QUEST_SELECTION);
        return requestId;
    }

    // ──────────────────────────────────────────────
    //  VRF Callback
    // ──────────────────────────────────────────────

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        PendingReward storage reward = pendingRewards[requestId];
        require(!reward.fulfilled, "RandomRewards: already fulfilled");

        reward.fulfilled = true;
        reward.randomResult = randomWords[0];
        totalRewardsFulfilled++;

        if (reward.rewardType == RewardType.BONUS_XP_MULTIPLIER) {
            _fulfillBonusXP(requestId, reward, randomWords[0]);
        } else if (reward.rewardType == RewardType.MYSTERY_REWARD) {
            _fulfillMysteryReward(requestId, reward, randomWords[0]);
        } else if (reward.rewardType == RewardType.DAILY_QUEST_SELECTION) {
            _fulfillDailyQuest(requestId, reward, randomWords[0]);
        }

        emit RandomRewardFulfilled(requestId, reward.player, reward.rewardType, randomWords[0]);
    }

    // ──────────────────────────────────────────────
    //  Internal Fulfillment
    // ──────────────────────────────────────────────

    function _fulfillBonusXP(
        uint256 requestId,
        PendingReward storage reward,
        uint256 randomWord
    ) internal {
        // Weighted selection: 40% 1x, 25% 1.5x, 20% 2x, 10% 3x, 5% 5x
        uint256 roll = randomWord % 100;
        uint256 multiplierIndex;

        if (roll < 40) multiplierIndex = 0;        // 1.0x (40%)
        else if (roll < 65) multiplierIndex = 1;    // 1.5x (25%)
        else if (roll < 85) multiplierIndex = 2;    // 2.0x (20%)
        else if (roll < 95) multiplierIndex = 3;    // 3.0x (10%)
        else multiplierIndex = 4;                    // 5.0x (5%)

        if (multiplierIndex >= bonusMultipliers.length) {
            multiplierIndex = 0;
        }

        uint256 multiplier = bonusMultipliers[multiplierIndex];
        uint256 totalXP = (reward.baseValue * multiplier) / 100;

        emit BonusXPAwarded(reward.player, reward.baseValue, multiplier, totalXP);
    }

    function _fulfillMysteryReward(
        uint256 requestId,
        PendingReward storage reward,
        uint256 randomWord
    ) internal {
        uint256 tierIndex = randomWord % mysteryRewardTiers.length;
        uint256 xpAmount = mysteryRewardTiers[tierIndex];

        emit MysteryRewardAwarded(reward.player, tierIndex, xpAmount);
    }

    function _fulfillDailyQuest(
        uint256 requestId,
        PendingReward storage reward,
        uint256 randomWord
    ) internal {
        uint256 questId = (randomWord % reward.baseValue) + 1;
        emit DailyQuestSelected(questId);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function getPlayerRewardCount(address player) external view returns (uint256) {
        return playerRewardHistory[player].length;
    }

    function getPendingReward(uint256 requestId) external view returns (PendingReward memory) {
        return pendingRewards[requestId];
    }

    function getBonusMultipliers() external view returns (uint256[] memory) {
        return bonusMultipliers;
    }

    function getMysteryRewardTiers() external view returns (uint256[] memory) {
        return mysteryRewardTiers;
    }
}
