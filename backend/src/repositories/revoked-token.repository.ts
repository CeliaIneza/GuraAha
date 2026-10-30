import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface RevokeTokenInput {
    jti: string;
    userId?: string | null;
    expiresAt: Date;
}

export class RevokedTokenRepository {
    async revoke(input: RevokeTokenInput, executor: QueryExecutor = db): Promise<void> {
        await executor.query(
            `
            INSERT INTO revoked_tokens (jti, user_id, expires_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (jti) DO NOTHING
            `,
            [input.jti, input.userId ?? null, input.expiresAt]
        );
    }

    async isRevoked(jti: string, executor: QueryExecutor = db): Promise<boolean> {
        const result = await executor.query(
            `
            SELECT 1 FROM revoked_tokens
            WHERE jti = $1 AND expires_at > NOW()
            LIMIT 1
            `,
            [jti]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async cleanupExpired(executor: QueryExecutor = db): Promise<number> {
        const result = await executor.query(
            `
            DELETE FROM revoked_tokens
            WHERE expires_at <= NOW()
            `
        );
        return result.rowCount ?? 0;
    }
}
