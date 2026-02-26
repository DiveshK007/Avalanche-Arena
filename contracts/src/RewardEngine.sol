// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RewardEngine
 * @notice Handles all reward settlement: XP, badges, NFT evolution.
 * @dev Separates validation logic (ProofValidator) from reward distribution.
 *
 * Only ProofValidator can call rewardPlayer.
 * RewardEngine orchestrates:
 *   - XP addition via PlayerProgress
 *   - Quest completion marking
 *   - Badge minting via BadgeToken (ERC-1155)
 *   - Identity NFT evolution trigger
 */
contract RewardEngine is Ownable, ReentrancyGuard {

    // ──────────────────────────────────────────────
    //  State: External Contracts
    // ──────────────────────────────────────────────

    IQuestRegistry public questRegistry;
    IPlayerProgress public playerProgress;
    IIdentityNFT public identityNFT;

    address public proofValidator;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event PlayerRewarded(address indexed player, uint256 indexed questId, uint256 xpAwarded);
    event IdentityEvolved(address indexed player, uint256 newLevel);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyValidator() {
        require(msg.sender == proofValidator, "RewardEngine: not validator");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ──────────────────────────────────────────────
    //  Configuration
    // ──────────────────────────────────────────────

    function setQuestRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "RewardEngine: zero address");
        questRegistry = IQuestRegistry(_registry);
    }

    function setPlayerProgress(address _progress) external onlyOwner {
        require(_progress != address(0), "RewardEngine: zero address");
        playerProgress = IPlayerProgress(_progress);
    }

    function setIdentityNFT(address _identity) external onlyOwner {
        require(_identity != address(0), "RewardEngine: zero address");
        identityNFT = IIdentityNFT(_identity);
    }

    function setProofValidator(address _validator) external onlyOwner {
        require(_validator != address(0), "RewardEngine: zero address");
        proofValidator = _validator;
    }

    // ──────────────────────────────────────────────
    //  Core: Reward Player
    // ──────────────────────────────────────────────

    /**
     * @notice Reward a player for quest completion
     * @dev Called only by ProofValidator after proof verification
     * @param player The player's wallet address
     * @param questId The completed quest ID
     */
    function rewardPlayer(address player, uint256 questId) external onlyValidator nonReentrant {
        // 1. Check quest is active
        (
            ,  // targetContract
            ,  // eventSig
            uint256 xpReward,
            ,  // difficulty
            ,  // cooldown (reserved for repeatable quests)
            bool active
        ) = questRegistry.quests(questId);

        require(active, "RewardEngine: quest not active");

        // 2. Check not already completed (single-completion quests)
        require(
            !playerProgress.questCompleted(player, questId),
            "RewardEngine: already completed"
        );

        // 3. Check cooldown (for repeatable quests — future)
        // For MVP, quests are single-completion

        // 4. Add XP
        playerProgress.addXP(player, xpReward);

        // 5. Mark quest completed
        playerProgress.markQuestCompleted(player, questId);

        // 6. Check for identity NFT evolution
        uint256 newLevel = playerProgress.level(player);
        _checkEvolution(player, newLevel);

        emit PlayerRewarded(player, questId, xpReward);
    }

    // ──────────────────────────────────────────────
    //  Internal: Evolution Check
    // ──────────────────────────────────────────────

    function _checkEvolution(address player, uint256 newLevel) internal {
        // Only evolve if player has minted identity NFT
        if (address(identityNFT) != address(0)) {
            try identityNFT.evolve(player, newLevel) {
                emit IdentityEvolved(player, newLevel);
            } catch {
                // Player may not have minted NFT yet — that's fine
            }
        }
    }
}

// ──────────────────────────────────────────────
//  Interfaces
// ──────────────────────────────────────────────

interface IQuestRegistry {
    function quests(uint256 questId)
        external
        view
        returns (
            address targetContract,
            bytes32 eventSig,
            uint256 xpReward,
            uint8 difficulty,
            uint256 cooldown,
            bool active
        );
}

interface IPlayerProgress {
    function totalXP(address player) external view returns (uint256);
    function level(address player) external view returns (uint256);
    function questCompleted(address player, uint256 questId) external view returns (bool);
    function addXP(address player, uint256 xp) external;
    function markQuestCompleted(address player, uint256 questId) external;
}

interface IIdentityNFT {
    function evolve(address player, uint256 newLevel) external;
}
