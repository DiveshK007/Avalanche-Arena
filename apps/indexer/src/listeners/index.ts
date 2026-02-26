import { ethers, WebSocketProvider, JsonRpcProvider } from "ethers";
import config from "../config";
import { logger } from "../logger";
import { handleEvent } from "../services/questMatcher";
import db from "../db/client";

/**
 * Game Event Listeners
 *
 * Connects to Avalanche RPC (WebSocket preferred) and listens for
 * events from registered game contracts.
 */

let provider: WebSocketProvider | JsonRpcProvider;
let activeListeners: Array<{ contract: string; eventSig: string }> = [];

/**
 * Start all event listeners
 */
export async function startListeners(): Promise<void> {
  // Try WebSocket first, fallback to HTTP polling
  try {
    if (config.wsUrl && config.wsUrl.startsWith("ws")) {
      provider = new ethers.WebSocketProvider(config.wsUrl);
      logger.info("Connected via WebSocket", { url: config.wsUrl.slice(0, 30) + "..." });
    } else {
      provider = new ethers.JsonRpcProvider(config.rpcUrl);
      logger.info("Connected via HTTP RPC (polling mode)", { url: config.rpcUrl.slice(0, 30) + "..." });
    }
  } catch (error) {
    logger.error("Failed to connect to RPC, using HTTP fallback");
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  // Get network info
  const network = await provider.getNetwork();
  logger.info("Connected to network", {
    chainId: network.chainId.toString(),
    name: network.name,
  });

  // Load registered quests from database and set up listeners
  await setupQuestListeners();

  // Handle reconnections for WebSocket
  if (provider instanceof WebSocketProvider) {
    (provider.websocket as any).on?.("close", () => {
      logger.warn("WebSocket disconnected, reconnecting in 5s...");
      setTimeout(() => startListeners(), 5000);
    });

    // Fallback for environments where .on() is not available
    provider.on("error", () => {
      logger.warn("Provider error, reconnecting in 5s...");
      setTimeout(() => startListeners(), 5000);
    });
  }
}

/**
 * Set up event listeners based on registered quests
 */
async function setupQuestListeners(): Promise<void> {
  // For MVP: listen to specific contracts registered in quests
  // In production: dynamically load from QuestRegistry contract

  const questRegistryABI = [
    "function questCount() view returns (uint256)",
    "function quests(uint256) view returns (address targetContract, bytes32 eventSig, uint256 xpReward, uint8 difficulty, uint256 cooldown, bool active)",
  ];

  if (!config.questRegistry) {
    logger.warn("No QuestRegistry address configured, using database quests only");
    return;
  }

  const registry = new ethers.Contract(config.questRegistry, questRegistryABI, provider);

  try {
    const questCount = await registry.questCount();
    logger.info(`Loading ${questCount} quests from registry`);

    // Collect unique contract+event pairs
    const listeners = new Map<string, Set<string>>();

    for (let i = 1; i <= questCount; i++) {
      const quest = await registry.quests(i);

      if (!quest.active) continue;

      const contractAddr = quest.targetContract.toLowerCase();
      const eventSig = quest.eventSig;

      if (!listeners.has(contractAddr)) {
        listeners.set(contractAddr, new Set());
      }
      listeners.get(contractAddr)!.add(eventSig);
    }

    // Set up listeners for each contract
    for (const [contractAddr, eventSigs] of listeners) {
      for (const eventSig of eventSigs) {
        const filter = {
          address: contractAddr,
          topics: [eventSig],
        };

        provider.on(filter, async (log) => {
          try {
            await handleEvent(log);
          } catch (error: any) {
            logger.error("Error handling event", {
              error: error.message,
              txHash: log.transactionHash,
            });
          }
        });

        activeListeners.push({ contract: contractAddr, eventSig });
        logger.info("Listener registered", {
          contract: contractAddr.slice(0, 10) + "...",
          event: eventSig.slice(0, 10) + "...",
        });
      }
    }

    logger.info(`${activeListeners.length} event listeners active`);
  } catch (error: any) {
    logger.error("Failed to load quests from registry", { error: error.message });
  }
}

/**
 * Process historical blocks (catch up after downtime)
 */
export async function catchUpFromBlock(fromBlock: number): Promise<void> {
  const currentBlock = await provider.getBlockNumber();

  if (fromBlock >= currentBlock) {
    logger.info("Already up to date");
    return;
  }

  logger.info(`Catching up from block ${fromBlock} to ${currentBlock}`);

  // Process in batches
  const batchSize = config.batchSize;

  for (let start = fromBlock; start <= currentBlock; start += batchSize) {
    const end = Math.min(start + batchSize - 1, currentBlock);

    for (const listener of activeListeners) {
      const filter = {
        address: listener.contract,
        topics: [listener.eventSig],
        fromBlock: start,
        toBlock: end,
      };

      const logs = await provider.getLogs(filter);

      for (const log of logs) {
        try {
          await handleEvent(log);
        } catch (error: any) {
          logger.error("Error processing historical event", {
            error: error.message,
            txHash: log.transactionHash,
          });
        }
      }
    }

    await db.setLastProcessedBlock(end);
    logger.debug(`Processed blocks ${start}-${end}`);
  }

  logger.info("Catch-up complete");
}

/**
 * Stop all listeners
 */
export async function stopListeners(): Promise<void> {
  provider.removeAllListeners();
  activeListeners = [];
  logger.info("All listeners stopped");
}
