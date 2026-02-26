import { ethers } from "ethers";
import config from "../config";
import { logger } from "../logger";

/**
 * EIP-191 Proof Signer
 *
 * Signs attestation payloads that ProofValidator contract verifies on-chain.
 */

const signer = new ethers.Wallet(config.signerPrivateKey);

export interface ProofPayload {
  player: string;
  questId: number;
  txHash: string;
  timestamp: number;
}

/**
 * Sign a proof payload using EIP-191 (personal sign)
 */
export async function signProof(proof: ProofPayload): Promise<string> {
  const messageHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes32", "uint256"],
      [proof.player, proof.questId, proof.txHash, proof.timestamp]
    )
  );

  const signature = await signer.signMessage(ethers.getBytes(messageHash));

  logger.debug("Proof signed", {
    player: proof.player,
    questId: proof.questId,
    signer: signer.address,
  });

  return signature;
}

/**
 * Get the signer address (for verification)
 */
export function getSignerAddress(): string {
  return signer.address;
}
