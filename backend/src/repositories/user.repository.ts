import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface CreateUserInput {
  roleId: number;
  phone: string;
  email?: string;
  username?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  mustChangePassword?: boolean;
}

const USER_COLUMNS_NO_HASH = `
  id,
  role_id,
  phone,
  email,
  username,
  first_name,
  last_name,
  status,
  must_change_password,
  last_login_at,
  phone_verified_at,
  email_verified_at,
  created_at,
  updated_at
`;

const ENRICHED_USER_SELECT = `
  SELECT
      u.id,
      u.role_id,
      r.name AS role,
      u.phone,
      u.email,
      u.username,
      u.password_hash,
      u.first_name,
      u.last_name,
      u.status,
      u.must_change_password,
      u.last_login_at,
      u.phone_verified_at,
      u.email_verified_at,
      u.created_at,
      u.updated_at,
      bp.id AS blocker_profile_id,
      bp.verification_code AS blocker_code,
      bp.status AS blocker_status,
      bp.rejection_reason AS blocker_rejection_reason,
      bp.national_id AS national_id,
      COALESCE(bp.area_text, CONCAT_WS(', ', loc.name, loc_parent.name)) AS area_text
  FROM users u
  INNER JOIN roles r ON r.id = u.role_id
  LEFT JOIN blocker_profiles bp ON bp.user_id = u.id
  LEFT JOIN locations loc ON loc.id = bp.operating_location_id
  LEFT JOIN locations loc_parent ON loc_parent.id = loc.parent_id
`;

function extractCorePhoneDigits(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) {
    return digits.slice(3); // 9 digits e.g. 788123456
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return digits.slice(1); // 9 digits e.g. 788123456
  }
  return digits;
}

export class UserRepository {
  async findById(userId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `${ENRICHED_USER_SELECT} WHERE u.id = $1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async findByPhone(phone: string, executor: QueryExecutor = db) {
    const trimmed = String(phone || "").trim();
    const coreDigits = extractCorePhoneDigits(trimmed);
    const result = await executor.query(
      `
      ${ENRICHED_USER_SELECT}
      WHERE u.phone = $1
         OR ($2 <> '' AND LENGTH($2) >= 8 AND RIGHT(REGEXP_REPLACE(u.phone, '[^0-9]', '', 'g'), 9) = RIGHT($2, 9))
      LIMIT 1
      `,
      [trimmed, coreDigits],
    );
    return result.rows[0] ?? null;
  }

  async findByEmail(email: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `${ENRICHED_USER_SELECT} WHERE LOWER(u.email) = LOWER($1) LIMIT 1`,
      [String(email || "").trim()],
    );
    return result.rows[0] ?? null;
  }

  async findByUsername(username: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `${ENRICHED_USER_SELECT} WHERE LOWER(u.username) = LOWER($1) LIMIT 1`,
      [String(username || "").trim()],
    );
    return result.rows[0] ?? null;
  }

  async findByIdentifier(identifier: string, executor: QueryExecutor = db) {
    const clean = String(identifier || "").trim();
    if (!clean) return null;

    // 1. Check email or username case-insensitively
    const byEmailOrUser = await executor.query(
      `
      ${ENRICHED_USER_SELECT}
      WHERE LOWER(u.email) = LOWER($1)
         OR LOWER(u.username) = LOWER($1)
      LIMIT 1
      `,
      [clean],
    );
    if (byEmailOrUser.rows[0]) {
      return byEmailOrUser.rows[0];
    }

    // 2. Check phone (exact or normalized last 9 digits)
    return this.findByPhone(clean, executor);
  }

  async findRoleByName(roleName: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `SELECT id FROM roles WHERE name = $1`,
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
            username,
            password_hash,
            first_name,
            last_name,
            must_change_password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING ${USER_COLUMNS_NO_HASH}
      `,
      [
        input.roleId,
        input.phone,
        input.email ? input.email.trim().toLowerCase() : null,
        input.username ? input.username.trim().toLowerCase() : null,
        input.passwordHash,
        input.firstName,
        input.lastName,
        input.mustChangePassword ?? false,
      ],
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
      [roleId, userId],
    );

    return result.rows[0] ?? null;
  }

  async updateLastLogin(userId: string, executor: QueryExecutor = db) {
    await executor.query(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [userId],
    );
  }

  async updateProfile(
    userId: string,
    input: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string | null;
      username?: string | null;
      areaText?: string | null;
    },
    executor: QueryExecutor = db,
  ) {
    if (input.username) {
      const existing = await executor.query(
        `SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id <> $2 LIMIT 1`,
        [input.username.trim(), userId],
      );
      if (existing.rows[0]) {
        throw new Error("That username is already taken. Please choose another one.");
      }
    }

    await executor.query(
      `
      UPDATE users
      SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        username = COALESCE($5, username),
        updated_at = NOW()
      WHERE id = $6
      `,
      [
        input.firstName ?? null,
        input.lastName ?? null,
        input.phone ?? null,
        input.email ? input.email.trim().toLowerCase() : null,
        input.username ? input.username.trim().toLowerCase() : null,
        userId,
      ],
    );

    if (input.areaText !== undefined) {
      await executor.query(
        `UPDATE blocker_profiles SET area_text = $1, updated_at = NOW() WHERE user_id = $2`,
        [input.areaText, userId],
      );
    }

    return this.findById(userId, executor);
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
    mustChangePassword = false,
    executor: QueryExecutor = db,
  ) {
    await executor.query(
      `
      UPDATE users
      SET
        password_hash = $1,
        must_change_password = $2,
        updated_at = NOW()
      WHERE id = $3
      `,
      [passwordHash, mustChangePassword, userId],
    );
  }

  async markVerified(
    userId: string,
    executor: QueryExecutor = db
  ) {
    const result = await executor.query(
      `
      UPDATE users
      SET phone_verified_at = NOW(),
          email_verified_at = NOW(),
          status = 'ACTIVE',
          updated_at = NOW()
      WHERE id = $1
      RETURNING ${USER_COLUMNS_NO_HASH}
      `,
      [userId]
    );

    return result.rows[0] ?? null;
  }
}
