// ──────────────────────────────────────────────
//  Quest Types
// ──────────────────────────────────────────────

export interface Quest {
  id: number;
  targetContract: string;
  eventSig: string;
  xpReward: number;
  difficulty: number;
  cooldown: number;
  active: boolean;
  // UI metadata (stored off-chain)
  title?: string;
  description?: string;
  gameName?: string;
  imageUrl?: string;
}

export interface QuestCompletion {
  id: number;
  player: string;
  questId: number;
  txHash: string;
  completedAt: Date;
}

// ──────────────────────────────────────────────
//  Player Types
// ──────────────────────────────────────────────

export interface Player {
  address: string;
  totalXP: number;
  level: number;
  questsCompleted: number;
  streak: number;
  lastQuestTime: number;
  rank?: number;
}

export interface PlayerStats {
  xp: number;
  level: number;
  completed: number;
  streak: number;
}

// ──────────────────────────────────────────────
//  Identity NFT Types
// ──────────────────────────────────────────────

export interface Identity {
  tokenId: number;
  level: number;
  totalXP: number;
  questsCompleted: number;
  mintedAt: number;
  faction: string;
  tier: string;
}

export type Faction = "Unaligned" | "Frostborn" | "Inferno" | "Shadow" | "Aether";

export type Tier = "Novice" | "Adventurer" | "Warrior" | "Champion" | "Legend" | "Mythic";

export function getTier(level: number): Tier {
  if (level < 3) return "Novice";
  if (level < 6) return "Adventurer";
  if (level < 10) return "Warrior";
  if (level < 15) return "Champion";
  if (level < 25) return "Legend";
  return "Mythic";
}

export function getTierColor(level: number): string {
  if (level < 3) return "#4a9eff";
  if (level < 6) return "#50c878";
  if (level < 10) return "#ff6b35";
  if (level < 15) return "#9b59b6";
  if (level < 25) return "#f1c40f";
  return "#e74c3c";
}

// ──────────────────────────────────────────────
//  Proof Types
// ──────────────────────────────────────────────

export interface Proof {
  player: string;
  questId: number;
  txHash: string;
  timestamp: number;
}

export interface SignedProof {
  proof: Proof;
  signature: string;
}

// ──────────────────────────────────────────────
//  API Response Types
// ──────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  totalXP: number;
  level: number;
  questsCompleted: number;
  tier: Tier;
}

export interface QuestFeedItem extends Quest {
  completedByUser: boolean;
  totalCompletions: number;
}

// ──────────────────────────────────────────────
//  Event Types (from partner games)
// ──────────────────────────────────────────────

export interface GameEvent {
  contractAddress: string;
  eventSignature: string;
  player: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  args: Record<string, unknown>;
}

// ──────────────────────────────────────────────
//  Config Types
// ──────────────────────────────────────────────

export interface ArenaConfig {
  questRegistry: string;
  playerProgress: string;
  proofValidator: string;
  rewardEngine: string;
  identityNFT: string;
  chainId: number;
  rpcUrl: string;
  wsUrl: string;
}
