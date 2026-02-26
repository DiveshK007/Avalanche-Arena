import { Router, Request, Response } from "express";
import pool from "../db";

export const playerRouter = Router();

/**
 * GET /player/:address
 * Get player profile + stats
 */
playerRouter.get("/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const addr = address.toLowerCase();

    // Get player data
    const player = await pool.query(
      "SELECT * FROM players WHERE address = $1",
      [addr]
    );

    if (player.rows.length === 0) {
      res.json({
        success: true,
        data: {
          address: addr,
          total_xp: 0,
          level: 0,
          quests_completed: 0,
          completions: [],
        },
      });
      return;
    }

    // Get completions
    const completions = await pool.query(
      `SELECT c.quest_id, c.tx_hash, c.completed_at, q.title, q.game_name, q.xp_reward
       FROM completions c
       LEFT JOIN quests q ON c.quest_id = q.id
       WHERE c.player = $1
       ORDER BY c.completed_at DESC`,
      [addr]
    );

    res.json({
      success: true,
      data: {
        ...player.rows[0],
        completions: completions.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    res.status(500).json({ success: false, error: "Failed to fetch player" });
  }
});

/**
 * GET /player/:address/quests
 * Get quest completion status for a player
 */
playerRouter.get("/:address/quests", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const addr = address.toLowerCase();

    // Get all quests with player completion status
    const result = await pool.query(
      `SELECT q.*,
        CASE WHEN c.player IS NOT NULL THEN true ELSE false END as completed,
        c.completed_at
       FROM quests q
       LEFT JOIN completions c ON q.id = c.quest_id AND c.player = $1
       WHERE q.active = true
       ORDER BY q.id ASC`,
      [addr]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching player quests:", error);
    res.status(500).json({ success: false, error: "Failed to fetch player quests" });
  }
});
