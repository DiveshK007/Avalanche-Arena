import { Router, Request, Response } from "express";
import pool from "../db";
import { requireAuth } from "./auth";
import { cached } from "../services/cache";

/**
 * Admin & Analytics Routes (#30)
 *
 * Protocol metrics: total players, quests completed/day, gas spent, retention.
 */

export const adminRouter = Router();

/**
 * GET /admin/analytics
 * Get comprehensive protocol analytics
 */
adminRouter.get("/analytics", async (_req: Request, res: Response) => {
  try {
    const data = await cached("arena:admin:analytics", 60, async () => {
      // Total players
      const playersResult = await pool.query("SELECT COUNT(*) as count FROM players");
      const totalPlayers = parseInt(playersResult.rows[0].count);

      // Active players (last 7 days)
      const activeResult = await pool.query(
        "SELECT COUNT(*) as count FROM players WHERE updated_at > NOW() - INTERVAL '7 days'"
      );
      const activePlayers = parseInt(activeResult.rows[0].count);

      // Total quests
      const questsResult = await pool.query("SELECT COUNT(*) as count FROM quests WHERE active = true");
      const totalQuests = parseInt(questsResult.rows[0].count);

      // Total completions
      const completionsResult = await pool.query("SELECT COUNT(*) as count FROM completions");
      const totalCompletions = parseInt(completionsResult.rows[0].count);

      // Completions today
      const todayResult = await pool.query(
        "SELECT COUNT(*) as count FROM completions WHERE completed_at > CURRENT_DATE"
      );
      const completionsToday = parseInt(todayResult.rows[0].count);

      // Completions by day (last 30 days)
      const dailyResult = await pool.query(
        `SELECT DATE(completed_at) as date, COUNT(*) as count
         FROM completions
         WHERE completed_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(completed_at)
         ORDER BY date ASC`
      );

      // Total XP earned
      const xpResult = await pool.query("SELECT COALESCE(SUM(total_xp), 0) as total FROM players");
      const totalXP = parseInt(xpResult.rows[0].total);

      // Average XP per player
      const avgXP = totalPlayers > 0 ? Math.round(totalXP / totalPlayers) : 0;

      // Tier distribution
      const tierResult = await pool.query(
        `SELECT
          CASE
            WHEN level < 3 THEN 'Novice'
            WHEN level < 6 THEN 'Adventurer'
            WHEN level < 10 THEN 'Warrior'
            WHEN level < 15 THEN 'Champion'
            WHEN level < 25 THEN 'Legend'
            ELSE 'Mythic'
          END as tier,
          COUNT(*) as count
         FROM players
         WHERE total_xp > 0
         GROUP BY tier
         ORDER BY count DESC`
      );

      // Faction distribution
      const factionResult = await pool.query(
        `SELECT faction, COUNT(*) as count
         FROM players
         WHERE faction IS NOT NULL AND faction != ''
         GROUP BY faction
         ORDER BY count DESC`
      );

      // Top quests by completions
      const topQuestsResult = await pool.query(
        `SELECT q.id, q.title, q.game_name, q.xp_reward, q.difficulty, COUNT(c.id) as completions
         FROM quests q
         LEFT JOIN completions c ON q.id = c.quest_id
         GROUP BY q.id
         ORDER BY completions DESC
         LIMIT 10`
      );

      // New players per day (last 30 days)
      const newPlayersResult = await pool.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM players
         WHERE created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      );

      return {
        overview: {
          totalPlayers,
          activePlayers,
          totalQuests,
          totalCompletions,
          completionsToday,
          totalXP,
          avgXP,
        },
        charts: {
          completionsByDay: dailyResult.rows,
          newPlayersByDay: newPlayersResult.rows,
          tierDistribution: tierResult.rows,
          factionDistribution: factionResult.rows,
        },
        topQuests: topQuestsResult.rows,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ success: false, error: "Failed to fetch analytics" });
  }
});

/**
 * GET /admin/indexer-status
 * Get indexer status
 */
adminRouter.get("/indexer-status", async (_req: Request, res: Response) => {
  try {
    const stateResult = await pool.query("SELECT * FROM indexer_state");
    const state: Record<string, string> = {};
    for (const row of stateResult.rows) {
      state[row.key] = row.value;
    }

    const recentEvents = await pool.query(
      `SELECT * FROM processed_events ORDER BY processed_at DESC LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        state,
        recentEvents: recentEvents.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching indexer status:", error);
    res.status(500).json({ success: false, error: "Failed to fetch indexer status" });
  }
});
