import {db} from '../config/database';

type QueryExecutor = { query: typeof db.query };

export interface CreateRefreshTokenInput {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
}

export class RefreshTokenRepository {
    async create(input: CreateRefreshTokenInput, executor: QueryExecutor = db) {
        const result = await executor.query(
            `
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
            VALUES ($1, $2, $3)
            RETURNING id, user_id, token_hash, expires_at, revoked_at, created_at
            `,
            [input.userId, input.tokenHash, input.expiresAt]
        );
        return result.rows[0];
    }

    async findValidByHash(tokenHash: string, executor: QueryExecutor = db) {
        const result = await executor.query(
            `
            SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
            FROM refresh_tokens
            WHERE token_hash = $1
                AND revoked_at IS NULL
                AND expires_at > NOW()
            `,
            [tokenHash]
        );
        return result.rows[0] ?? null;
    }

    async revoke(id: string, executor: QueryExecutor = db) {
        await executor.query(
            `
            UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1
            `,
            [id]
        );
    }

    // when an admin suspends/deactivates a user and existing sessions should die.
    async revokeAllForUser(userId: string, executor: QueryExecutor = db) {
        await executor.query(
            `
            UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL
            `,
            [userId]
        );
    }
}