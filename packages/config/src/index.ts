/**
 * Avalanche Arena — Shared Configuration
 *
 * Contract addresses, chain config, and ABIs.
 * Import this in API, Indexer, and Frontend.
 */

// ──────────────────────────────────────────────
//  Chain Configuration
// ──────────────────────────────────────────────

export const CHAINS = {
  avalanche: {
    chainId: 43114,
    name: "Avalanche C-Chain",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    wsUrl: "wss://api.avax.network/ext/bc/C/ws",
    explorer: "https://snowtrace.io",
    currency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  },
  fuji: {
    chainId: 43113,
    name: "Avalanche Fuji Testnet",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    wsUrl: "wss://api.avax-test.network/ext/bc/C/ws",
    explorer: "https://testnet.snowtrace.io",
    currency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  },
  localhost: {
    chainId: 31337,
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    wsUrl: "ws://127.0.0.1:8545",
    explorer: "",
    currency: { name: "ETH", symbol: "ETH", decimals: 18 },
  },
} as const;

// ──────────────────────────────────────────────
//  XP & Progression Constants
// ──────────────────────────────────────────────

export const PROGRESSION = {
  SCALING_FACTOR: 100,
  STREAK_WINDOW: 7 * 24 * 60 * 60, // 7 days in seconds
  MAX_LEVEL: 100,

  // XP reward weights by difficulty
  DIFFICULTY_WEIGHTS: {
    1: 1.0,
    2: 1.5,
    3: 2.0,
    4: 3.0,
    5: 5.0,
  },

  // Level thresholds for tiers
  TIERS: [
    { name: "Novice", minLevel: 0, color: "#4a9eff" },
    { name: "Adventurer", minLevel: 3, color: "#50c878" },
    { name: "Warrior", minLevel: 6, color: "#ff6b35" },
    { name: "Champion", minLevel: 10, color: "#9b59b6" },
    { name: "Legend", minLevel: 15, color: "#f1c40f" },
    { name: "Mythic", minLevel: 25, color: "#e74c3c" },
  ],
} as const;

// ──────────────────────────────────────────────
//  Factions
// ──────────────────────────────────────────────

export const FACTIONS = [
  { name: "Frostborn", color: "#4a9eff", description: "Masters of ice and patience" },
  { name: "Inferno", color: "#e74c3c", description: "Wielders of fire and fury" },
  { name: "Shadow", color: "#8e44ad", description: "Dwellers of the unseen" },
  { name: "Aether", color: "#f1c40f", description: "Channelers of pure energy" },
] as const;

// ──────────────────────────────────────────────
//  Quest Difficulty Labels
// ──────────────────────────────────────────────

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
  4: "Very Hard",
  5: "Legendary",
};

// ──────────────────────────────────────────────
//  Contract ABIs (Minimal — for frontend/indexer)
// ──────────────────────────────────────────────

export const ABIS = {
  QuestRegistry: [
    "function questCount() view returns (uint256)",
    "function quests(uint256) view returns (address targetContract, bytes32 eventSig, uint256 xpReward, uint8 difficulty, uint256 cooldown, bool active)",
    "function getQuest(uint256 questId) view returns (tuple(address targetContract, bytes32 eventSig, uint256 xpReward, uint8 difficulty, uint256 cooldown, bool active))",
    "function isQuestActive(uint256 questId) view returns (bool)",
    "function createQuest(address targetContract, bytes32 eventSig, uint256 xpReward, uint8 difficulty, uint256 cooldown) returns (uint256)",
    "event QuestCreated(uint256 indexed questId, address indexed targetContract, uint256 xpReward)",
  ],

  PlayerProgress: [
    "function totalXP(address) view returns (uint256)",
    "function level(address) view returns (uint256)",
    "function questsCompleted(address) view returns (uint256)",
    "function streak(address) view returns (uint256)",
    "function questCompleted(address, uint256) view returns (bool)",
    "function hasCompletedQuest(address player, uint256 questId) view returns (bool)",
    "function getPlayerStats(address player) view returns (uint256 xp, uint256 playerLevel, uint256 completed, uint256 playerStreak)",
    "function calculateLevel(uint256 xp) pure returns (uint256)",
    "event XPAdded(address indexed player, uint256 amount, uint256 newTotal)",
    "event LevelUp(address indexed player, uint256 newLevel)",
    "event QuestCompleted(address indexed player, uint256 indexed questId)",
  ],

  ProofValidator: [
    "function submitProof(tuple(address player, uint256 questId, bytes32 txHash, uint256 timestamp) proof, bytes signature)",
    "function proofUsed(bytes32) view returns (bool)",
    "function trustedSigner() view returns (address)",
    "event ProofAccepted(address indexed player, uint256 indexed questId, bytes32 txHash)",
  ],

  IdentityNFT: [
    "function mintIdentity() returns (uint256)",
    "function setFaction(string faction)",
    "function hasMinted(address) view returns (bool)",
    "function playerTokenId(address) view returns (uint256)",
    "function identities(uint256) view returns (uint256 level, uint256 totalXP, uint256 questsCompleted, uint256 mintedAt, string faction)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "event IdentityMinted(address indexed player, uint256 tokenId)",
    "event IdentityEvolved(address indexed player, uint256 newLevel, uint256 totalXP)",
  ],

  // Mock game events for indexer
  MockGame: [
    "event MatchWon(address indexed player)",
    "event NFTMinted(address indexed player, uint256 tokenId)",
    "event BossDefeated(address indexed player, uint256 bossId)",
    "event ItemCrafted(address indexed player, uint256 itemId)",
    "function winMatch()",
    "function mintGameNFT(uint256 tokenId)",
    "function defeatBoss(uint256 bossId)",
    "function craftItem(uint256 itemId)",
  ],
} as const;

// Re-export IPFS utilities
export {
  buildIdentityMetadata,
  buildBadgeMetadata,
  uploadToIPFS,
  uploadImageToIPFS,
  ipfsToHTTP,
  validateMetadata,
} from "./ipfs";

export type { NFTMetadata, NFTAttribute } from "./ipfs";
