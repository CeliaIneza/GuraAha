import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface SettingDbRow {
    key: string;
    value: string;
    description: string | null;
    updated_at: Date;
}

export class SettingRepository {
    async getByKey(key: string, executor: QueryExecutor = db): Promise<SettingDbRow | null> {
        const result = await executor.query(
            `
            SELECT key, value, description, updated_at
            FROM settings
            WHERE key = $1
            LIMIT 1
            `,
            [key]
        );
        return result.rows[0] ?? null;
    }

    async getAll(executor: QueryExecutor = db): Promise<SettingDbRow[]> {
        const result = await executor.query(
            `
            SELECT key, value, description, updated_at
            FROM settings
            ORDER BY key ASC
            `
        );
        return result.rows;
    }

    async getByKeys(keys: string[], executor: QueryExecutor = db): Promise<SettingDbRow[]> {
        if (keys.length === 0) return [];
        const result = await executor.query(
            `
            SELECT key, value, description, updated_at
            FROM settings
            WHERE key = ANY($1::text[])
            ORDER BY key ASC
            `,
            [keys]
        );
        return result.rows;
    }

    async upsert(
        key: string,
        value: string,
        description?: string | null,
        executor: QueryExecutor = db
    ): Promise<SettingDbRow> {
        const result = await executor.query(
            `
            INSERT INTO settings (key, value, description, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (key) DO UPDATE
            SET
                value = EXCLUDED.value,
                description = COALESCE(EXCLUDED.description, settings.description),
                updated_at = NOW()
            RETURNING key, value, description, updated_at
            `,
            [key, value, description ?? null]
        );
        return result.rows[0];
    }

    async delete(key: string, executor: QueryExecutor = db): Promise<boolean> {
        const result = await executor.query(
            `
            DELETE FROM settings
            WHERE key = $1
            `,
            [key]
        );
        return (result.rowCount ?? 0) > 0;
    }
}
