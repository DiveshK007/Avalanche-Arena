import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

/**
 * Indexer Configuration
 */
export const config = {
  // RPC — defaults to Fuji testnet; override with INDEXER_RPC_URL for other networks
  rpcUrl: process.env.INDEXER_RPC_URL || process.env.FUJI_RPC_URL || "http://127.0.0.1:8545",
  wsUrl: process.env.INDEXER_WS_URL || process.env.FUJI_WS_URL || "ws://127.0.0.1:8545",

  // Contract addresses
  questRegistry: process.env.QUEST_REGISTRY_ADDRESS || "",
  playerProgress: process.env.PLAYER_PROGRESS_ADDRESS || "",
  proofValidator: process.env.PROOF_VALIDATOR_ADDRESS || "",
  rewardEngine: process.env.REWARD_ENGINE_ADDRESS || "",

  // Proof signer
  signerPrivateKey: process.env.PROOF_SIGNER_PRIVATE_KEY || "",

  // Database
  databaseUrl: process.env.DATABASE_URL || "postgresql://arena:arena@localhost:5432/avalanche_arena",

  // Indexer settings
  confirmations: 1, // Blocks to wait before processing
  batchSize: 100,   // Events per batch
  pollInterval: 5000, // ms between polls (fallback if WS fails)

  // Chain
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "43113"),
};

export default config;
