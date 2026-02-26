// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ProofValidator
 * @notice Validates quest completion proofs submitted by the off-chain verifier/indexer.
 * @dev Trust bridge between off-chain event detection and on-chain reward settlement.
 *
 * Flow:
 *   1. Indexer detects game event
 *   2. Generates attestation payload
 *   3. Signs with EIP-191 (future: EIP-712)
 *   4. Submits proof to this contract
 *   5. Contract verifies signature + conditions
 *   6. Forwards to RewardEngine
 */
contract ProofValidator is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ──────────────────────────────────────────────
    //  Data Structures
    // ──────────────────────────────────────────────

    struct Proof {
        address player;
        uint256 questId;
        bytes32 txHash;
        uint256 timestamp;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    address public trustedSigner;
    address public rewardEngine;

    // Replay protection: proofHash => used
    mapping(bytes32 => bool) public proofUsed;

    // Proof expiry window (prevents stale proofs)
    uint256 public constant PROOF_EXPIRY = 1 hours;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event ProofAccepted(address indexed player, uint256 indexed questId, bytes32 txHash);
    event ProofRejected(address indexed player, uint256 indexed questId, string reason);
    event TrustedSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event RewardEngineSet(address indexed engine);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(address _trustedSigner) Ownable(msg.sender) {
        require(_trustedSigner != address(0), "ProofValidator: zero signer");
        trustedSigner = _trustedSigner;
    }

    // ──────────────────────────────────────────────
    //  Configuration
    // ──────────────────────────────────────────────

    function setTrustedSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "ProofValidator: zero signer");
        address old = trustedSigner;
        trustedSigner = _newSigner;
        emit TrustedSignerUpdated(old, _newSigner);
    }

    function setRewardEngine(address _engine) external onlyOwner {
        require(_engine != address(0), "ProofValidator: zero address");
        rewardEngine = _engine;
        emit RewardEngineSet(_engine);
    }

    // ──────────────────────────────────────────────
    //  Core: Submit Proof
    // ──────────────────────────────────────────────

    /**
     * @notice Submit a signed proof of quest completion
     * @param proof The proof payload
     * @param signature EIP-191 signature from trusted signer
     */
    function submitProof(
        Proof calldata proof,
        bytes calldata signature
    ) external {
        // 1. Compute message hash
        bytes32 messageHash = keccak256(
            abi.encode(
                proof.player,
                proof.questId,
                proof.txHash,
                proof.timestamp
            )
        );

        // 2. Recover signer
        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        require(signer == trustedSigner, "ProofValidator: invalid signer");

        // 3. Check replay
        bytes32 proofHash = keccak256(abi.encode(proof.txHash, proof.questId, proof.player));
        require(!proofUsed[proofHash], "ProofValidator: proof already used");

        // 4. Check expiry
        require(
            block.timestamp <= proof.timestamp + PROOF_EXPIRY,
            "ProofValidator: proof expired"
        );

        // 5. Mark used
        proofUsed[proofHash] = true;

        // 6. Forward to RewardEngine
        require(rewardEngine != address(0), "ProofValidator: reward engine not set");
        IRewardEngine(rewardEngine).rewardPlayer(proof.player, proof.questId);

        emit ProofAccepted(proof.player, proof.questId, proof.txHash);
    }

    /**
     * @notice Batch submit multiple proofs
     * @param proofs Array of proof payloads
     * @param signatures Array of corresponding signatures
     */
    function submitProofBatch(
        Proof[] calldata proofs,
        bytes[] calldata signatures
    ) external {
        require(proofs.length == signatures.length, "ProofValidator: length mismatch");

        for (uint256 i = 0; i < proofs.length; i++) {
            // We use try/catch pattern internally to not revert entire batch
            _processProof(proofs[i], signatures[i]);
        }
    }

    // ──────────────────────────────────────────────
    //  Internal
    // ──────────────────────────────────────────────

    function _processProof(Proof calldata proof, bytes calldata signature) internal {
        bytes32 messageHash = keccak256(
            abi.encode(
                proof.player,
                proof.questId,
                proof.txHash,
                proof.timestamp
            )
        );

        address signer = messageHash.toEthSignedMessageHash().recover(signature);

        if (signer != trustedSigner) {
            emit ProofRejected(proof.player, proof.questId, "invalid signer");
            return;
        }

        bytes32 proofHash = keccak256(abi.encode(proof.txHash, proof.questId, proof.player));

        if (proofUsed[proofHash]) {
            emit ProofRejected(proof.player, proof.questId, "already used");
            return;
        }

        if (block.timestamp > proof.timestamp + PROOF_EXPIRY) {
            emit ProofRejected(proof.player, proof.questId, "expired");
            return;
        }

        proofUsed[proofHash] = true;

        IRewardEngine(rewardEngine).rewardPlayer(proof.player, proof.questId);

        emit ProofAccepted(proof.player, proof.questId, proof.txHash);
    }
}

// ──────────────────────────────────────────────
//  Interface
// ──────────────────────────────────────────────

interface IRewardEngine {
    function rewardPlayer(address player, uint256 questId) external;
}
