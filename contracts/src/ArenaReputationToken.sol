// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArenaReputationToken (ART)
 * @notice ERC-20 reputation token for Avalanche Arena cross-chain reputation.
 * @dev This token is the "home" token that can be bridged to game L1s via ICTT.
 *
 * Token Economics:
 *   - Minted by RewardEngine when players complete quests
 *   - 1 XP = 1 ART (reputation tokens mirror XP)
 *   - Transferable across Avalanche L1s via ICTT ERC20TokenHome/Remote
 *   - Used for governance voting weight
 *   - Burnable for marketplace discounts
 *   - Non-tradeable on DEXes (reputation, not currency)
 *
 * ICTT Integration:
 *   - Deploy ERC20TokenHome with this token
 *   - Lock ART → mint wrapped ART on game chains
 *   - Enables cross-chain reputation portability
 */
contract ArenaReputationToken is ERC20, ERC20Burnable, Ownable {

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    /// @notice Addresses authorized to mint tokens (RewardEngine, ICM Verifier)
    mapping(address => bool) public minters;

    /// @notice ICTT TokenHome contract address (for bridging)
    address public tokenHome;

    /// @notice Total reputation minted per player
    mapping(address => uint256) public lifetimeReputation;

    /// @notice Maximum supply cap (anti-inflation)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18; // 1 billion ART

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event ReputationMinted(address indexed player, uint256 amount);
    event TokenHomeSet(address indexed tokenHome);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyMinter() {
        require(minters[msg.sender], "ART: not a minter");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() ERC20("Arena Reputation Token", "ART") Ownable(msg.sender) {
        // Owner starts as a minter
        minters[msg.sender] = true;
    }

    // ──────────────────────────────────────────────
    //  Minter Management
    // ──────────────────────────────────────────────

    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "ART: zero address");
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    function setTokenHome(address _tokenHome) external onlyOwner {
        require(_tokenHome != address(0), "ART: zero address");
        tokenHome = _tokenHome;
        emit TokenHomeSet(_tokenHome);
    }

    // ──────────────────────────────────────────────
    //  Minting (RewardEngine, ICM Verifier)
    // ──────────────────────────────────────────────

    /**
     * @notice Mint reputation tokens to a player
     * @param player The player to mint to
     * @param amount Amount of ART to mint (1 ART = 1 XP)
     */
    function mintReputation(address player, uint256 amount) external onlyMinter {
        require(player != address(0), "ART: zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "ART: supply cap reached");

        _mint(player, amount);
        lifetimeReputation[player] += amount;

        emit ReputationMinted(player, amount);
    }

    // ──────────────────────────────────────────────
    //  ICTT: Pre-approve TokenHome for bridging
    // ──────────────────────────────────────────────

    /**
     * @notice Approve the ICTT TokenHome to spend tokens for cross-chain bridging
     * @param amount Amount to approve
     */
    function approveForBridge(uint256 amount) external {
        require(tokenHome != address(0), "ART: token home not set");
        _approve(msg.sender, tokenHome, amount);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function getLifetimeReputation(address player) external view returns (uint256) {
        return lifetimeReputation[player];
    }

    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }
}
