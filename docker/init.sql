-- Avalanche Arena — Database Schema
-- Auto-created on first boot

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_completions_player ON completions(player);
CREATE INDEX IF NOT EXISTS idx_completions_quest ON completions(quest_id);
CREATE INDEX IF NOT EXISTS idx_processed_block ON processed_events(block_number);
CREATE INDEX IF NOT EXISTS idx_quests_contract ON quests(contract_address);
CREATE INDEX IF NOT EXISTS idx_players_xp ON players(total_xp DESC);
