import { db } from '../config/database';

type QueryExecutor = { query: typeof db.query };

export interface SettingRow {
  key: string;
  value: string;
  description: string | null;
  updated_at?: Date;
}

export class SettingsRepository {
  async getAll(
    executor: QueryExecutor = db
  ): Promise<Array<{ key: string; value: string; description: string | null }>> {
    const result = await executor.query(
      `SELECT key, value, description FROM settings ORDER BY key ASC`
    );
    return result.rows;
  }

  async getByKey(
    key: string,
    executor: QueryExecutor = db
  ): Promise<{ key: string; value: string; description: string | null } | null> {
    const result = await executor.query(
      `SELECT key, value, description FROM settings WHERE key = $1`,
      [key]
    );
    return result.rows[0] ?? null;
  }

  async upsert(
    key: string,
    value: string,
    description?: string,
    executor: QueryExecutor = db
  ): Promise<{ key: string; value: string; description: string | null }> {
    const result = await executor.query(
      `
      INSERT INTO settings (key, value, description, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          description = COALESCE(EXCLUDED.description, settings.description),
          updated_at = NOW()
      RETURNING key, value, description
      `,
      [key, value, description ?? null]
    );
    return result.rows[0]!;
  }
}
