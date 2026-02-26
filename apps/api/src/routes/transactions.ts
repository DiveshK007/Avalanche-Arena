import { Router, Request, Response } from "express";
import pool from "../db";

/**
 * Transaction History Routes (#11)
 *
 * Shows on-chain transaction history for players.
 */

export const transactionsRouter = Router();

/**
 * GET /transactions/:address
 * Get transaction history for a player
 */
transactionsRouter.get("/:address", async (req: Request, res: Response) => {
  try {
    const addr = req.params.address.toLowerCase();
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const txType = req.query.type as string | undefined;

    let query = `SELECT * FROM transactions WHERE player = $1`;
    const params: any[] = [addr];
    let paramIdx = 2;

    if (txType) {
      query += ` AND tx_type = $${paramIdx++}`;
      params.push(txType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`;
    params.push(Math.min(limit, 200), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        offset,
        limit,
        hasMore: result.rows.length === Math.min(limit, 200),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch transactions" });
  }
});

/**
 * POST /transactions (internal — called by indexer)
 * Record a new transaction
 */
transactionsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { player, txHash, txType, details, blockNumber, gasUsed } = req.body;

    if (!player || !txHash || !txType) {
      res.status(400).json({ success: false, error: "Missing required fields" });
      return;
    }

    await pool.query(
      `INSERT INTO transactions (player, tx_hash, tx_type, details, block_number, gas_used)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (tx_hash) DO NOTHING`,
      [player.toLowerCase(), txHash, txType, JSON.stringify(details || {}), blockNumber, gasUsed]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error recording transaction:", error);
    res.status(500).json({ success: false, error: "Failed to record transaction" });
  }
});
