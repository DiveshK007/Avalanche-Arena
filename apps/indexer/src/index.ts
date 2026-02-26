import config from "./config";
import { logger } from "./logger";
import db from "./db/client";
import { startListeners, catchUpFromBlock, stopListeners } from "./listeners";
import { initProofGenerator } from "./services/proofGenerator";

/**
 * 🔺 Avalanche Arena — Indexer / Proof Engine
 *
 * Main entry point for the off-chain indexer that:
 *   1. Listens to partner game contract events
 *   2. Matches events to registered quests
 *   3. Generates signed attestation proofs
 *   4. Submits proofs to ProofValidator contract
 *
 * Design: Off-chain compute, on-chain settlement.
 */

async function main() {
  logger.info("═".repeat(50));
  logger.info("🔺 Avalanche Arena — Indexer Starting");
  logger.info("═".repeat(50));

  // 1. Initialize database
  logger.info("Initializing database...");
  await db.initialize();

  // 2. Initialize proof generator
  logger.info("Initializing proof generator...");
  initProofGenerator();

  // 3. Catch up from last processed block
  const lastBlock = await db.getLastProcessedBlock();
  if (lastBlock > 0) {
    logger.info(`Last processed block: ${lastBlock}`);
    await catchUpFromBlock(lastBlock + 1);
  }

  // 4. Start real-time listeners
  logger.info("Starting event listeners...");
  await startListeners();

  logger.info("═".repeat(50));
  logger.info("🔺 Indexer is running and listening for events");
  logger.info("═".repeat(50));

  // Graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Shutting down...");
    await stopListeners();
    await db.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("Shutting down...");
    await stopListeners();
    await db.close();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
