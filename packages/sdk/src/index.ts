/**
 * Avalanche Arena — Multi-Game SDK
 *
 * Lightweight SDK for game developers to integrate their game with Arena.
 *
 * Usage:
 *   import { ArenaSDK } from '@arena/sdk';
 *
 *   const arena = new ArenaSDK({
 *     apiUrl: 'https://arena-api.avax.network',
 *     gameId: 'my-awesome-game',
 *   });
 *
 *   // Check if player has completed a quest
 *   const completed = await arena.hasCompleted(playerAddress, questId);
 *
 *   // Get player stats
 *   const stats = await arena.getPlayerStats(playerAddress);
 *
 *   // Trigger quest verification after game event
 *   await arena.reportEvent(playerAddress, txHash);
 */

import type { Player, PlayerStats, Quest, Proof } from "@arena/types";

// ──────────────────────────────────────────
//  SDK Configuration
// ──────────────────────────────────────────

export interface ArenaSDKConfig {
  /** Arena API base URL */
  apiUrl: string;
  /** Your game identifier */
  gameId: string;
  /** API key for authenticated endpoints (optional) */
  apiKey?: string;
  /** Request timeout in ms (default: 10000) */
  timeout?: number;
}

// ──────────────────────────────────────────
//  SDK Response Types
// ──────────────────────────────────────────

export interface SDKResponse<T> {
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
}

export interface QuestStatus {
  questId: number;
  completed: boolean;
  completedAt?: string;
  xpEarned?: number;
}

// ──────────────────────────────────────────
//  Arena SDK Class
// ──────────────────────────────────────────

export class ArenaSDK {
  private config: Required<ArenaSDKConfig>;

  constructor(config: ArenaSDKConfig) {
    this.config = {
      apiKey: "",
      timeout: 10000,
      ...config,
    };
  }

  // ── Player Methods ─────────────────────

  /**
   * Get player profile and stats
   */
  async getPlayer(address: string): Promise<Player | null> {
    return this.request<Player>(`/player/${address.toLowerCase()}`);
  }

  /**
   * Get player on-chain stats (XP, level, quests, streak)
   */
  async getPlayerStats(address: string): Promise<PlayerStats | null> {
    const player = await this.getPlayer(address);
    if (!player) return null;
    return {
      xp: player.totalXP,
      level: player.level,
      completed: player.questsCompleted,
      streak: player.streak,
    };
  }

  /**
   * Get the player's rank on the global leaderboard
   */
  async getPlayerRank(address: string): Promise<number | null> {
    const player = await this.getPlayer(address);
    return player?.rank ?? null;
  }

  // ── Quest Methods ──────────────────────

  /**
   * Get all quests, optionally filtered by difficulty
   */
  async getQuests(params?: { difficulty?: number; limit?: number; offset?: number }): Promise<Quest[]> {
    const searchParams = new URLSearchParams();
    if (params?.difficulty) searchParams.set("difficulty", params.difficulty.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    const qs = searchParams.toString();
    return (await this.request<Quest[]>(`/quests${qs ? `?${qs}` : ""}`)) ?? [];
  }

  /**
   * Get a specific quest by ID
   */
  async getQuest(questId: number): Promise<Quest | null> {
    return this.request<Quest>(`/quests/${questId}`);
  }

  /**
   * Check if a player has completed a specific quest
   */
  async hasCompleted(address: string, questId: number): Promise<boolean> {
    const quests = await this.request<any[]>(`/player/${address.toLowerCase()}/quests`);
    if (!quests) return false;
    return quests.some((q: any) => (q.questId || q.quest_id || q.id) === questId);
  }

  /**
   * Get all quest completion statuses for a player
   */
  async getQuestStatuses(address: string): Promise<QuestStatus[]> {
    const quests = await this.request<any[]>(`/player/${address.toLowerCase()}/quests`);
    if (!quests) return [];
    return quests.map((q: any) => ({
      questId: q.questId || q.quest_id || q.id,
      completed: true,
      completedAt: q.completedAt || q.completed_at,
      xpEarned: q.xpReward || q.xp_reward,
    }));
  }

  // ── Leaderboard Methods ────────────────

  /**
   * Get global leaderboard
   */
  async getLeaderboard(limit = 100, cursor?: string): Promise<LeaderboardEntry[]> {
    const searchParams = new URLSearchParams({ limit: limit.toString() });
    if (cursor) searchParams.set("cursor", cursor);
    return (await this.request<LeaderboardEntry[]>(`/leaderboard?${searchParams}`)) ?? [];
  }

  /**
   * Get global stats (total players, quests, etc.)
   */
  async getGlobalStats(): Promise<Record<string, any> | null> {
    return this.request<Record<string, any>>("/leaderboard/stats");
  }

  // ── Achievement Methods ────────────────

  /**
   * Get all achievements
   */
  async getAchievements(): Promise<any[]> {
    return (await this.request<any[]>("/achievements")) ?? [];
  }

  /**
   * Get player's earned achievements
   */
  async getPlayerAchievements(address: string): Promise<any[]> {
    return (await this.request<any[]>(`/achievements/player/${address.toLowerCase()}`)) ?? [];
  }

  // ── Event Reporting ────────────────────

  /**
   * Report a game event for quest matching
   * (Used when game has its own event processing)
   */
  async reportEvent(params: {
    playerAddress: string;
    txHash: string;
    eventType: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      await this.request<any>("/events/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: this.config.gameId,
          ...params,
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  // ── Utility ────────────────────────────

  /**
   * Health check — verify API connection
   */
  async ping(): Promise<boolean> {
    try {
      const data = await this.request<{ status: string }>("/health");
      return data?.status === "ok";
    } catch {
      return false;
    }
  }

  /**
   * Get SDK version
   */
  get version(): string {
    return "0.1.0";
  }

  // ── Internal ───────────────────────────

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: Record<string, string> = {};
      if (this.config.apiKey) {
        headers["X-API-Key"] = this.config.apiKey;
      }
      headers["X-Game-ID"] = this.config.gameId;

      const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options?.headers },
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const json = await response.json();

      if (json.success === false) {
        return null;
      }

      return json.data ?? json;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Re-export types
export type { Player, PlayerStats, Quest, Proof } from "@arena/types";
