/**
 * Avalanche Arena — Contract Configuration
 *
 * Contract addresses and ABIs for frontend interaction.
 */

// Contract addresses (set via environment variables after deployment)
export const CONTRACTS = {
  questRegistry: process.env.NEXT_PUBLIC_QUEST_REGISTRY_ADDRESS || "",
  playerProgress: process.env.NEXT_PUBLIC_PLAYER_PROGRESS_ADDRESS || "",
  proofValidator: process.env.NEXT_PUBLIC_PROOF_VALIDATOR_ADDRESS || "",
  rewardEngine: process.env.NEXT_PUBLIC_REWARD_ENGINE_ADDRESS || "",
  identityNFT: process.env.NEXT_PUBLIC_IDENTITY_NFT_ADDRESS || "",
} as const;

// Chain configuration
export const CHAIN_CONFIG = {
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "43113"),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
};

// ABIs
export const QUEST_REGISTRY_ABI = [
  "function questCount() view returns (uint256)",
  "function quests(uint256) view returns (address targetContract, bytes32 eventSig, uint256 xpReward, uint8 difficulty, uint256 cooldown, bool active)",
  "function getQuest(uint256 questId) view returns (tuple(address targetContract, bytes32 eventSig, uint256 xpReward, uint8 difficulty, uint256 cooldown, bool active))",
  "function isQuestActive(uint256 questId) view returns (bool)",
] as const;

export const PLAYER_PROGRESS_ABI = [
  "function totalXP(address) view returns (uint256)",
  "function level(address) view returns (uint256)",
  "function questsCompleted(address) view returns (uint256)",
  "function streak(address) view returns (uint256)",
  "function questCompleted(address, uint256) view returns (bool)",
  "function hasCompletedQuest(address player, uint256 questId) view returns (bool)",
  "function getPlayerStats(address player) view returns (uint256 xp, uint256 playerLevel, uint256 completed, uint256 playerStreak)",
  "function calculateLevel(uint256 xp) pure returns (uint256)",
] as const;

export const IDENTITY_NFT_ABI = [
  "function mintIdentity() returns (uint256)",
  "function setFaction(string faction)",
  "function hasMinted(address) view returns (bool)",
  "function playerTokenId(address) view returns (uint256)",
  "function identities(uint256) view returns (uint256 level, uint256 totalXP, uint256 questsCompleted, uint256 mintedAt, string faction)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address) view returns (uint256)",
] as const;

export const PROOF_VALIDATOR_ABI = [
  "function submitProof(tuple(address player, uint256 questId, bytes32 txHash, uint256 timestamp) proof, bytes signature)",
  "function proofUsed(bytes32) view returns (bool)",
  "function trustedSigner() view returns (address)",
] as const;
