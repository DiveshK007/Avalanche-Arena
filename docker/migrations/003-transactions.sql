-- Migration 003: Transaction history table
-- For improvement #11

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  player TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  tx_type TEXT NOT NULL,              -- 'mint_identity', 'set_faction', 'quest_complete', 'reward_claim'
  details JSONB DEFAULT '{}',
  block_number BIGINT,
  gas_used BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- Migration 003b: Add analytics tracking columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS first_quest_at TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS faction TEXT DEFAULT '';
