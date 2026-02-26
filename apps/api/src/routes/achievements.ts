import { Router, Request, Response } from "express";
import pool from "../db";
import { cached, CACHE_KEYS, CACHE_TTL } from "../services/cache";

/**
 * Achievement Routes (#29)
 *
 * On-chain achievement badges — earned by completing milestones.
 */

export const achievementsRouter = Router();

/**
 * GET /achievements
 * List all achievements
 */
achievementsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const data = await cached("arena:achievements:all", 300, async () => {
      const result = await pool.query(
        "SELECT * FROM achievements ORDER BY requirement_value ASC"
      );
      return result.rows;
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ success: false, error: "Failed to fetch achievements" });
  }
});

/**
 * GET /achievements/player/:address
 * Get a player's earned achievements
 */
achievementsRouter.get("/player/:address", async (req: Request, res: Response) => {
  try {
    const addr = req.params.address.toLowerCase();

    const result = await pool.query(
      `SELECT a.*, pa.earned_at, pa.tx_hash
       FROM achievements a
       LEFT JOIN player_achievements pa ON a.id = pa.achievement_id AND pa.player = $1
       ORDER BY a.requirement_value ASC`,
      [addr]
    );

    const achievements = result.rows.map((row: any) => ({
      ...row,
      earned: !!row.earned_at,
    }));

    res.json({ success: true, data: achievements });
  } catch (error) {
    console.error("Error fetching player achievements:", error);
    res.status(500).json({ success: false, error: "Failed to fetch player achievements" });
  }
});

/**
 * POST /achievements/check/:address
 * Check and award any newly eligible achievements for a player
 */
achievementsRouter.post("/check/:address", async (req: Request, res: Response) => {
  try {
    const addr = req.params.address.toLowerCase();

    // Get player stats
    const playerResult = await pool.query(
      "SELECT * FROM players WHERE address = $1",
      [addr]
    );

    if (playerResult.rows.length === 0) {
      res.json({ success: true, data: { newAchievements: [] } });
      return;
    }

    const player = playerResult.rows[0];

    // Get all unearned achievements
    const unearnedResult = await pool.query(
      `SELECT a.*
       FROM achievements a
       WHERE a.id NOT IN (
         SELECT achievement_id FROM player_achievements WHERE player = $1
       )`,
      [addr]
    );

    const newAchievements: any[] = [];

    for (const achievement of unearnedResult.rows) {
      let qualified = false;

      switch (achievement.requirement_type) {
        case "quest_count":
          qualified = player.quests_completed >= achievement.requirement_value;
          break;
        case "xp_total":
          qualified = player.total_xp >= achievement.requirement_value;
          break;
        case "level":
          qualified = player.level >= achievement.requirement_value;
          break;
        case "leaderboard_rank": {
          const rankResult = await pool.query(
            `SELECT COUNT(*) + 1 as rank FROM players
             WHERE total_xp > (SELECT total_xp FROM players WHERE address = $1)`,
            [addr]
          );
          qualified = parseInt(rankResult.rows[0].rank) <= achievement.requirement_value;
          break;
        }
        case "streak":
          // Streak checking — simplified
          break;
      }

      if (qualified) {
        await pool.query(
          "INSERT INTO player_achievements (player, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [addr, achievement.id]
        );
        newAchievements.push(achievement);
      }
    }

    res.json({
      success: true,
      data: { newAchievements },
    });
  } catch (error) {
    console.error("Error checking achievements:", error);
    res.status(500).json({ success: false, error: "Failed to check achievements" });
  }
});
