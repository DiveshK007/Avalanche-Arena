import { ethers } from "ethers";
import config from "../config";
import db from "../db/client";
import { logger } from "../logger";
import { signProof, ProofPayload } from "./signer";
import { addToRetryQueue, initRetryQueue } from "./retryQueue";

/**
 * Proof Generator & On-Chain Submitter
 *
 * Generates attestation payloads, signs them, and submits to ProofValidator.
 */

// ProofValidator ABI (minimal)
const PROOF_VALIDATOR_ABI = [
  "function submitProof(tuple(address player, uint256 questId, bytes32 txHash, uint256 timestamp) proof, bytes signature)",
];

let provider: ethers.JsonRpcProvider;
let proofValidatorContract: ethers.Contract;
let submitterWallet: ethers.Wallet;

/**
 * Initialize the proof generator
 */
export function initProofGenerator() {
  provider = new ethers.JsonRpcProvider(config.rpcUrl);
  submitterWallet = new ethers.Wallet(config.signerPrivateKey, provider);

  proofValidatorContract = new ethers.Contract(
    config.proofValidator,
    PROOF_VALIDATOR_ABI,
    submitterWallet
  );

  logger.info("Proof generator initialized", {
    validator: config.proofValidator,
    submitter: submitterWallet.address,
  });

  // Initialize retry queue with the submit function
  initRetryQueue(generateAndSubmitProof);
}

/**
 * Generate proof, sign it, and submit on-chain
 */
export async function generateAndSubmitProof(
  player: string,
  questId: number,
  txHash: string
): Promise<boolean> {
  try {
    // 1. Build proof payload
    const proof: ProofPayload = {
      player,
      questId,
      txHash,
      timestamp: Math.floor(Date.now() / 1000),
    };

    // 2. Sign proof
    const signature = await signProof(proof);

    // 3. Submit on-chain
    logger.info("Submitting proof on-chain", {
      player,
      questId,
      txHash: txHash.slice(0, 10) + "...",
    });

    const tx = await proofValidatorContract.submitProof(
      {
        player: proof.player,
        questId: proof.questId,
        txHash: proof.txHash,
        timestamp: proof.timestamp,
      },
      signature
    );

    const receipt = await tx.wait();

    logger.info("Proof submitted successfully", {
      player,
      questId,
      txHash: receipt.hash,
      gasUsed: receipt.gasUsed.toString(),
    });

    // 4. Record in database
    await db.recordCompletion(player, questId, txHash);

    return true;
  } catch (error: any) {
    logger.error("Failed to submit proof", {
      player,
      questId,
      error: error.message,
    });

    // Add to retry queue for automatic retry with exponential backoff
    addToRetryQueue(player, questId, txHash, error.message);
    return false;
  }
}
