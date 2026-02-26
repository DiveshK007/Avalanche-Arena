import { Pool } from "pg";
import config from "../config";
import { logger } from "../logger";

/**
 * PostgreSQL database client
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on("error", (err) => {
  logger.error("Unexpected database error:", err);
});

export const db = {
  /**
   * Initialize database tables
   */
  async initialize(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS players (
          address TEXT PRIMARY KEY,
          total_xp BIGINT DEFAULT 0,
          level INT DEFAULT 0,
          quests_completed INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS quests (
          id SERIAL PRIMARY KEY,
          contract_address TEXT NOT NULL,
          event_sig TEXT NOT NULL,
          xp_reward INT NOT NULL,
          difficulty INT DEFAULT 1,
          cooldown INT DEFAULT 0,
          active BOOLEAN DEFAULT true,
          title TEXT,
          description TEXT,
          game_name TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS completions (
          id SERIAL PRIMARY KEY,
          player TEXT NOT NULL,
          quest_id INT NOT NULL,
          tx_hash TEXT NOT NULL UNIQUE,
          completed_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (player) REFERENCES players(address),
          FOREIGN KEY (quest_id) REFERENCES quests(id)
        );

        CREATE TABLE IF NOT EXISTS processed_events (
          tx_hash TEXT PRIMARY KEY,
          block_number BIGINT NOT NULL,
          processed_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS indexer_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_completions_player ON completions(player);
        CREATE INDEX IF NOT EXISTS idx_completions_quest ON completions(quest_id);
        CREATE INDEX IF NOT EXISTS idx_processed_block ON processed_events(block_number);
      `);
      logger.info("Database tables initialized");
    } finally {
      client.release();
    }
  },

  /**
   * Check if event has been processed (replay protection)
   */
  async isEventProcessed(txHash: string): Promise<boolean> {
    const result = await pool.query(
      "SELECT 1 FROM processed_events WHERE tx_hash = $1",
      [txHash]
    );
    return result.rows.length > 0;
  },

  /**
   * Mark event as processed
   */
  async markEventProcessed(txHash: string, blockNumber: number): Promise<void> {
    await pool.query(
      "INSERT INTO processed_events (tx_hash, block_number) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [txHash, blockNumber]
    );
  },

  /**
   * Check if player has completed a quest
   */
  async hasPlayerCompletedQuest(player: string, questId: number): Promise<boolean> {
    const result = await pool.query(
      "SELECT 1 FROM completions WHERE player = $1 AND quest_id = $2",
      [player.toLowerCase(), questId]
    );
    return result.rows.length > 0;
  },

  /**
   * Record quest completion
   */
  async recordCompletion(player: string, questId: number, txHash: string): Promise<void> {
    const addr = player.toLowerCase();

    // Ensure player exists
    await pool.query(
      "INSERT INTO players (address) VALUES ($1) ON CONFLICT DO NOTHING",
      [addr]
    );

    // Record completion
    await pool.query(
      "INSERT INTO completions (player, quest_id, tx_hash) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [addr, questId, txHash]
    );
  },

  /**
   * Get active quests by contract address
   */
  async getQuestsByContract(contractAddress: string): Promise<any[]> {
    const result = await pool.query(
      "SELECT * FROM quests WHERE contract_address = $1 AND active = true",
      [contractAddress.toLowerCase()]
    );
    return result.rows;
  },

  /**
   * Get last processed block number
   */
  async getLastProcessedBlock(): Promise<number> {
    const result = await pool.query(
      "SELECT value FROM indexer_state WHERE key = 'last_block'"
    );
    return result.rows.length > 0 ? parseInt(result.rows[0].value) : 0;
  },

  /**
   * Save last processed block number
   */
  async setLastProcessedBlock(blockNumber: number): Promise<void> {
    await pool.query(
      `INSERT INTO indexer_state (key, value, updated_at)
       VALUES ('last_block', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [blockNumber.toString()]
    );
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT address, total_xp, level, quests_completed
       FROM players
       ORDER BY total_xp DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  /**
   * Get player data
   */
  async getPlayer(address: string): Promise<any | null> {
    const result = await pool.query(
      "SELECT * FROM players WHERE address = $1",
      [address.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  /**
   * Update player XP and level
   */
  async updatePlayerXP(address: string, xp: number, level: number): Promise<void> {
    await pool.query(
      `UPDATE players
       SET total_xp = $2, level = $3, quests_completed = quests_completed + 1, updated_at = NOW()
       WHERE address = $1`,
      [address.toLowerCase(), xp, level]
    );
  },

  /**
   * Get all quest completions for a player
   */
  async getPlayerCompletions(address: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT c.*, q.title, q.game_name, q.xp_reward
       FROM completions c
       JOIN quests q ON c.quest_id = q.id
       WHERE c.player = $1
       ORDER BY c.completed_at DESC`,
      [address.toLowerCase()]
    );
    return result.rows;
  },

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await pool.end();
  },
};

export default db;
