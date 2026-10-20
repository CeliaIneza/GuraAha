import { db } from '../config/database';

type QueryExecutor = { query: typeof db.query };

export class LottoRepository {
  // No separate CreateLottoEntryInput — a lotto entry is never created on
  // its own, only as a side effect of a contact unlock
  async create(userId: string, contactUnlockId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      INSERT INTO lotto_entries (user_id, contact_unlock_id)
      VALUES ($1, $2)
      RETURNING id, user_id, contact_unlock_id, created_at
      `,
      [userId, contactUnlockId]
    );
    return result.rows[0];
  }

  async findByUserId(userId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT id, user_id, contact_unlock_id, created_at
      FROM lotto_entries
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );
    return result.rows;
  }

  async countAll(executor: QueryExecutor = db) {
    const result = await executor.query(`SELECT COUNT(*)::int AS count FROM lotto_entries`);
    return result.rows[0].count as number;
  }
}