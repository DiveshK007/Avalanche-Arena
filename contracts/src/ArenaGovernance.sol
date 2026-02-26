// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArenaGovernance
 * @notice Lightweight on-chain governance for Avalanche Arena.
 * @dev Allows identity NFT holders to propose and vote on:
 *   - New quests to add
 *   - XP reward adjustments
 *   - New game integrations
 *   - Parameter changes
 *
 * Voting power is based on player level (from PlayerProgress).
 * Future: migrate to Governor + TimelockController for full DAO.
 */
contract ArenaGovernance is Ownable {

    // ──────────────────────────────────────────────
    //  Data Structures
    // ──────────────────────────────────────────────

    enum ProposalState { Active, Passed, Rejected, Executed, Cancelled }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        ProposalState state;
        bytes callData;         // Optional: encoded function call for execution
        address targetContract; // Optional: contract to call on execution
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    IPlayerProgress public playerProgress;
    IIdentityNFT public identityNFT;

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_LEVEL_TO_PROPOSE = 3;   // Adventurer tier
    uint256 public constant MIN_LEVEL_TO_VOTE = 1;       // Level 1+
    uint256 public constant QUORUM_VOTES = 10;            // Minimum total votes

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event ProposalCreated(uint256 indexed id, address indexed proposer, string title);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(address _playerProgress, address _identityNFT) Ownable(msg.sender) {
        playerProgress = IPlayerProgress(_playerProgress);
        identityNFT = IIdentityNFT(_identityNFT);
    }

    // ──────────────────────────────────────────────
    //  Proposal Creation
    // ──────────────────────────────────────────────

    /**
     * @notice Create a new proposal
     * @param title Short title
     * @param description Detailed description
     * @param targetContract Contract to call if proposal passes (address(0) for signal vote)
     * @param callData Encoded function call for execution
     */
    function createProposal(
        string calldata title,
        string calldata description,
        address targetContract,
        bytes calldata callData
    ) external returns (uint256) {
        require(
            identityNFT.hasMinted(msg.sender),
            "Governance: must hold identity NFT"
        );
        require(
            playerProgress.level(msg.sender) >= MIN_LEVEL_TO_PROPOSE,
            "Governance: insufficient level to propose"
        );

        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            title: title,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_PERIOD,
            state: ProposalState.Active,
            callData: callData,
            targetContract: targetContract
        });

        emit ProposalCreated(proposalCount, msg.sender, title);
        return proposalCount;
    }

    // ──────────────────────────────────────────────
    //  Voting
    // ──────────────────────────────────────────────

    /**
     * @notice Vote on an active proposal
     * @param proposalId The proposal to vote on
     * @param support True = for, false = against
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];

        require(p.state == ProposalState.Active, "Governance: not active");
        require(block.timestamp <= p.endTime, "Governance: voting ended");
        require(!hasVoted[proposalId][msg.sender], "Governance: already voted");
        require(
            identityNFT.hasMinted(msg.sender),
            "Governance: must hold identity NFT"
        );
        require(
            playerProgress.level(msg.sender) >= MIN_LEVEL_TO_VOTE,
            "Governance: insufficient level to vote"
        );

        hasVoted[proposalId][msg.sender] = true;

        // Voting weight = player level (higher level = more influence)
        uint256 weight = playerProgress.level(msg.sender);

        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    // ──────────────────────────────────────────────
    //  Resolution
    // ──────────────────────────────────────────────

    /**
     * @notice Finalize a proposal after voting period ends
     */
    function finalize(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.Active, "Governance: not active");
        require(block.timestamp > p.endTime, "Governance: voting in progress");

        uint256 totalVotes = p.forVotes + p.againstVotes;

        if (totalVotes >= QUORUM_VOTES && p.forVotes > p.againstVotes) {
            p.state = ProposalState.Passed;
        } else {
            p.state = ProposalState.Rejected;
        }
    }

    /**
     * @notice Execute a passed proposal (owner only for safety)
     */
    function execute(uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.Passed, "Governance: not passed");
        require(p.targetContract != address(0), "Governance: no target");

        p.state = ProposalState.Executed;

        (bool success,) = p.targetContract.call(p.callData);
        require(success, "Governance: execution failed");

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal (only proposer or owner)
     */
    function cancel(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(
            msg.sender == p.proposer || msg.sender == owner(),
            "Governance: not authorized"
        );
        require(p.state == ProposalState.Active, "Governance: not active");

        p.state = ProposalState.Cancelled;
        emit ProposalCancelled(proposalId);
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getVotingPower(address voter) external view returns (uint256) {
        if (!identityNFT.hasMinted(voter)) return 0;
        return playerProgress.level(voter);
    }
}

// ──────────────────────────────────────────────
//  Interfaces
// ──────────────────────────────────────────────

interface IPlayerProgress {
    function level(address) external view returns (uint256);
}

interface IIdentityNFT {
    function hasMinted(address) external view returns (bool);
}
