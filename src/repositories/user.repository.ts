import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface CreateUserInput {
  roleId: number;
  phone: string;
  email?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

const USER_COLUMNS_NO_HASH = `
  id,
  role_id,
  phone,
  email,
  first_name,
  last_name,
  status,
  phone_verified_at,
  email_verified_at,
  created_at,
  updated_at
`;

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

  async findByPhone(phone: string, executor: QueryExecutor = db) {
    const result = await executor.query(
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
        WHERE u.phone = $1
      `,
      [phone]
    );

    return result.rows[0] ?? null;
  }


  async findByEmail(email: string, executor: QueryExecutor = db) {
    const result = await executor.query(
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
        WHERE u.email = $1
      `,
      [email]
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


  async create(input: CreateUserInput, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
        INSERT INTO users (
            role_id,
            phone,
            email,
            password_hash,
            first_name,
            last_name
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING ${USER_COLUMNS_NO_HASH}
      `,
      [
        input.roleId,
        input.phone,
        input.email ?? null,
        input.passwordHash,
        input.firstName,
        input.lastName
      ]
    );

    return result.rows[0];
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
