import { db } from "../config/database";

export class UserRepository {
    async findById(userId: string) {
        const result = await db.query(
            `
            SELECT
            u.id,
            u.role_id,
            r.name AS role,
            u.phone,
            u.email,
            u.password_hash,
            u.first_name,
            u.last_name,
            u.status,
            u.phone_verified_at,
            u.email_verified_at,
            u.created_at,
            u.updated_at
            FROM users u
            INNER JOIN roles r ON r.id = u.role_id
            WHERE u.id = $1
            `,
            [userId]
        );

        return result.rows[0] ?? null;
    }

    async findRoleByName(roleName: string) {
        const result = await db.query(
            `
            SELECT id
            FROM roles WHERE name = $1
            `,
            [roleName]
        );
        return result.rows[0]?.id ?? null;
    }
}