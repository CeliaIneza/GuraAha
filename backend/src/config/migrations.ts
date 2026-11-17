import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

import { db } from "./database";
import { env } from "./env";

const migrationsDirectory = path.resolve(process.cwd(), "database/migrations");

async function ensureDatabaseExists(): Promise<void> {
  try {
    const testClient = await db.connect();
    testClient.release();
  } catch (err: any) {
    if (err?.code === "3D000") {
      const url = new URL(env.DATABASE_URL);
      const dbName = url.pathname.replace(/^\/+/, "");
      if (dbName && /^[a-zA-Z0-9_-]+$/.test(dbName)) {
        url.pathname = "/postgres";
        const adminClient = new Client({ connectionString: url.toString() });
        await adminClient.connect();
        try {
          console.log(`Database "${dbName}" does not exist. Creating it...`);
          await adminClient.query(`CREATE DATABASE "${dbName}"`);
          console.log(`Created database "${dbName}".`);
        } finally {
          await adminClient.end();
        }
      }
    } else {
      throw err;
    }
  }
}

async function runMigrations(): Promise<void> {
  await ensureDatabaseExists();
  const client = await db.connect();
  try {
    await client.query(`
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
      const result = await client.query(
        `SELECT 1 FROM schema_migrations WHERE filename = $1`,
        [filename],
      );

      if (result.rowCount && result.rowCount > 0) {
        continue;
      }

      const filePath = path.join(migrationsDirectory, filename);
      const sql = await readFile(filePath, "utf-8");

      console.log(`Running migration: ${filename}`);

      await client.query("BEGIN");

      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations (filename) VALUES ($1)`,
          [filename],
        );
        await client.query("COMMIT");

        console.log(`Applied migration: ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");

        console.error(`Failed to apply migration: ${filename}`);
        throw error;
      }
    }
  } finally {
    client.release();
  }
}

export default runMigrations;
