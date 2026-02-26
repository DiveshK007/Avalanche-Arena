-- Migration 002: Achievement badges table (ERC-1155 style)
-- For improvement #29

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  requirement_type TEXT NOT NULL,   -- 'quest_count', 'xp_total', 'level', 'leaderboard_rank', 'streak'
  requirement_value INT NOT NULL,
  badge_uri TEXT,                    -- IPFS URI for badge metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_achievements (
  id SERIAL PRIMARY KEY,
  player TEXT NOT NULL REFERENCES players(address),
  achievement_id INT NOT NULL REFERENCES achievements(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  tx_hash TEXT,
  UNIQUE(player, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_player_achievements_player ON player_achievements(player);

-- Seed default achievements
INSERT INTO achievements (slug, title, description, icon, requirement_type, requirement_value) VALUES
  ('first_quest', 'First Steps', 'Complete your first quest', '🎯', 'quest_count', 1),
  ('ten_quests', 'Quest Runner', 'Complete 10 quests', '⚡', 'quest_count', 10),
  ('fifty_quests', 'Quest Master', 'Complete 50 quests', '🏅', 'quest_count', 50),
  ('hundred_xp', 'XP Rookie', 'Earn 100 XP', '✨', 'xp_total', 100),
  ('thousand_xp', 'XP Veteran', 'Earn 1,000 XP', '💫', 'xp_total', 1000),
  ('ten_thousand_xp', 'XP Legend', 'Earn 10,000 XP', '🌟', 'xp_total', 10000),
  ('level_five', 'Rising Star', 'Reach level 5', '⭐', 'level', 5),
  ('level_ten', 'Warrior', 'Reach level 10', '⚔️', 'level', 10),
  ('level_25', 'Mythic', 'Reach level 25', '🔥', 'level', 25),
  ('top_ten', 'Elite', 'Reach top 10 on leaderboard', '🏆', 'leaderboard_rank', 10),
  ('streak_seven', 'Hot Streak', 'Maintain a 7-day streak', '🔥', 'streak', 7)
ON CONFLICT (slug) DO NOTHING;
