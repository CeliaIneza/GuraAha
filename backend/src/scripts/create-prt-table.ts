import { db } from '../config/database.js';

async function main() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      token      VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id)`);
  console.log('password_reset_tokens table created (or already exists).');
  await db.end();
}

main().catch(async (err) => {
  console.error('Migration failed:', err.message);
  await db.end();
  process.exit(1);
});
