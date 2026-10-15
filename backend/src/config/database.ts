import { Pool } from 'pg';
import { env } from './env';



export const db = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

db.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
});