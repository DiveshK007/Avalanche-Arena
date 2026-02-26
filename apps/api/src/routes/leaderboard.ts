import { Router, Request, Response } from "express";
import pool from "../db";
import { cached, CACHE_KEYS, CACHE_TTL } from "../services/cache";

export const leaderboardRouter = Router();

/**
 * GET /leaderboard
 * Get top players by XP (cached)
 */
leaderboardRouter.get("/", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const cursor = req.query.cursor as string | undefined;

    // Cursor-based pagination (improvement #14)
    const cacheKey = `${CACHE_KEYS.LEADERBOARD}:${limit}:${offset}`;

    const data = await cached(cacheKey, CACHE_TTL.LEADERBOARD, async () => {
      let query: string;
      let params: any[];

      if (cursor) {
        // Cursor-based: get players with XP less than cursor value
        query = `SELECT
          address, total_xp, level, quests_completed,
          ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
         FROM players
         WHERE total_xp > 0 AND total_xp < $1
         ORDER BY total_xp DESC
         LIMIT $2`;
        params = [parseInt(cursor), Math.min(limit, 500)];
      } else {
        query = `SELECT
          address, total_xp, level, quests_completed,
          ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
         FROM players
         WHERE total_xp > 0
         ORDER BY total_xp DESC
         LIMIT $1 OFFSET $2`;
        params = [Math.min(limit, 500), offset];
      }

      const result = await pool.query(query, params);

      return result.rows.map((row: any) => ({
        ...row,
        tier: getTier(row.level),
      }));
    });

    const nextCursor = data.length > 0 ? data[data.length - 1].total_xp : null;

    res.json({
      success: true,
      data,
      pagination: {
        nextCursor,
        hasMore: data.length === Math.min(limit, 500),
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ success: false, error: "Failed to fetch leaderboard" });
  }
});

/**
 * GET /leaderboard/stats
 * Get global stats (cached)
 */
leaderboardRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const data = await cached(CACHE_KEYS.GLOBAL_STATS, CACHE_TTL.GLOBAL_STATS, async () => {
      const players = await pool.query("SELECT COUNT(*) as count FROM players WHERE total_xp > 0");
      const quests = await pool.query("SELECT COUNT(*) as count FROM quests WHERE active = true");
      const completions = await pool.query("SELECT COUNT(*) as count FROM completions");
      const totalXP = await pool.query("SELECT COALESCE(SUM(total_xp), 0) as total FROM players");

      return {
        totalPlayers: parseInt(players.rows[0].count),
        activeQuests: parseInt(quests.rows[0].count),
        totalCompletions: parseInt(completions.rows[0].count),
        totalXPEarned: parseInt(totalXP.rows[0].total),
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

function getTier(level: number): string {
  if (level < 3) return "Novice";
  if (level < 6) return "Adventurer";
  if (level < 10) return "Warrior";
  if (level < 15) return "Champion";
  if (level < 25) return "Legend";
  return "Mythic";
}
