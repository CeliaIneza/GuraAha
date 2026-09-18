import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export class UserRepository {
  async findById(userId: string, executor: QueryExecutor = db) {
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
      [userId],
    );

    return result.rows[0] ?? null;
  }

  async findRoleByName(roleName: string, executor: QueryExecutor = db) {
    const result = await db.query(
      `
            SELECT id
            FROM roles WHERE name = $1
            `,
      [roleName],
    );
    return result.rows[0]?.id ?? null;
  }

  async updateRole(
    userId: string,
    roleId: number,
    executor: QueryExecutor = db,
  ) {
    const result = await executor.query(
        `
            UPDATE users
            SET role_id = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, role_id
        `,
        [roleId, userId]
    );

    return result.rows[0] ?? null;
  }
}
