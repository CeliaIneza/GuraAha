import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { db } from "./database";

const migrationsDirectory = path.resolve(process.cwd(), "database/migrations");

async function runMigrations(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `);

  const files = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

    for (const filename of files) {
        const result = await db.query(
            `SELECT 1 FROM schema_migrations WHERE filename = $1`,
            [filename],
        );

        if (result.rowCount && result.rowCount > 0) {
            continue;
        }

        const filePath = path.join(migrationsDirectory, filename);
        const sql = await readFile(filePath, "utf-8");

        console.log(`Running migration: ${filename}`);

        await db.query('BEGIN');

        try {
            await db.query(sql);
            await db.query(
                `INSERT INTO schema_migrations (filename) VALUES ($1)`,
                [filename],
            );
            await db.query('COMMIT');

            console.log(`Applied migration: ${filename}`);
        } catch (error) {
            await db.query('ROLLBACK');

            console.error(`Failed to apply migration: ${filename}`);
            throw error;
        }
    }
}

export default runMigrations;
