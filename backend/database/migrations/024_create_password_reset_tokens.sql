
-- Run this directly in psql or your DB client to create the password_reset_tokens table
-- If password_reset_tokens already exists, this is safe to run again (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);
