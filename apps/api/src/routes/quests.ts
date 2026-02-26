import { Router, Request, Response } from "express";
import pool from "../db";
import { cached, CACHE_KEYS, CACHE_TTL } from "../services/cache";

export const questsRouter = Router();

/**
 * GET /quests
 * Get all active quests (cached, paginated)
 */
questsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : undefined;

    const cacheKey = `${CACHE_KEYS.QUESTS_ACTIVE}:${difficulty || "all"}:${limit}:${offset}`;

    const data = await cached(cacheKey, CACHE_TTL.QUESTS, async () => {
      let query = "SELECT * FROM quests WHERE active = true";
      const params: any[] = [];
      let paramIdx = 1;

      if (difficulty) {
        query += ` AND difficulty = $${paramIdx++}`;
        params.push(difficulty);
      }

      query += ` ORDER BY id ASC LIMIT $${paramIdx++} OFFSET $${paramIdx}`;
      params.push(Math.min(limit, 200), offset);

      const result = await pool.query(query, params);
      return result.rows;
    });

    res.json({
      success: true,
      data,
      pagination: {
        offset,
        limit,
        hasMore: data.length === Math.min(limit, 200),
      },
    });
  } catch (error) {
    console.error("Error fetching quests:", error);
    res.status(500).json({ success: false, error: "Failed to fetch quests" });
  }
});

/**
 * GET /quests/:id
 * Get a specific quest
 */
questsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM quests WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Quest not found" });
      return;
    }

    // Get completion count
    const completions = await pool.query(
      "SELECT COUNT(*) as count FROM completions WHERE quest_id = $1",
      [id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        totalCompletions: parseInt(completions.rows[0].count),
      },
    });
  } catch (error) {
    console.error("Error fetching quest:", error);
    res.status(500).json({ success: false, error: "Failed to fetch quest" });
  }
});

/**
 * GET /quests/:id/completions
 * Get all completions for a quest
 */
questsRouter.get("/:id/completions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.player, c.tx_hash, c.completed_at
       FROM completions c
       WHERE c.quest_id = $1
       ORDER BY c.completed_at DESC
       LIMIT 100`,
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching completions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch completions" });
  }
});
