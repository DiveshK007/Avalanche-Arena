import { ethers, Log } from "ethers";
import db from "../db/client";
import { logger } from "../logger";
import { generateAndSubmitProof } from "./proofGenerator";

/**
 * Quest Matching Engine
 *
 * Receives raw on-chain events, matches them to registered quests,
 * and triggers proof generation for valid completions.
 */

interface QuestRecord {
  id: number;
  contract_address: string;
  event_sig: string;
  xp_reward: number;
  cooldown: number;
}

/**
 * Handle a detected game event
 */
export async function handleEvent(log: Log): Promise<void> {
  const txHash = log.transactionHash;
  const contractAddress = log.address.toLowerCase();

  // 1. Check if already processed (replay protection)
  if (await db.isEventProcessed(txHash)) {
    logger.debug("Event already processed, skipping", { txHash: txHash.slice(0, 10) });
    return;
  }

  // 2. Extract player address from event topics
  const player = extractPlayer(log);
  if (!player) {
    logger.warn("Could not extract player from event", { txHash });
    return;
  }

  // 3. Get matching quests for this contract
  const quests: QuestRecord[] = await db.getQuestsByContract(contractAddress);
  if (quests.length === 0) {
    logger.debug("No quests registered for contract", { contract: contractAddress });
    return;
  }

  // 4. Match event to quest
  for (const quest of quests) {
    const eventSigFromLog = log.topics[0];

    if (eventSigFromLog?.toLowerCase() !== quest.event_sig.toLowerCase()) {
      continue;
    }

    // 5. Check if player already completed this quest
    if (await db.hasPlayerCompletedQuest(player, quest.id)) {
      logger.debug("Quest already completed by player", {
        player: player.slice(0, 10),
        questId: quest.id,
      });
      continue;
    }

    // 6. All checks passed — generate and submit proof
    logger.info("Quest match found! Generating proof", {
      player: player.slice(0, 10) + "...",
      questId: quest.id,
      xpReward: quest.xp_reward,
    });

    await generateAndSubmitProof(player, quest.id, txHash);
  }

  // 7. Mark event as processed
  await db.markEventProcessed(txHash, log.blockNumber);
}

/**
 * Extract player address from event log
 *
 * Most game events have player as first indexed parameter (topics[1])
 */
function extractPlayer(log: Log): string | null {
  try {
    if (log.topics.length >= 2) {
      // Indexed address is padded to 32 bytes in topics
      const rawAddress = log.topics[1];
      return ethers.getAddress("0x" + rawAddress.slice(26));
    }
    return null;
  } catch {
    return null;
  }
}
