-- Migration 004: API session / nonce table for SIWE auth
-- For improvement #4

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,              -- session token / JWT id
  address TEXT NOT NULL,
  nonce TEXT NOT NULL,
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_valid BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_sessions_address ON sessions(address);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Cleanup expired sessions periodically
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
