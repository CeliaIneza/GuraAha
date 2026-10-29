import { db } from '../config/database';

type QueryExecutor = { query: typeof db.query };

export interface CreateOtpInput {
  userId: string;
  phone: string;
  purpose: string;
  codeHash: string;
  expiresAt: Date;
}

const OTP_COLUMNS = `
  id,
  user_id,
  phone,
  purpose,
  code_hash,
  expires_at,
  verified_at,
  attempts,
  created_at
`;

export class OtpRepository {
  async create(input: CreateOtpInput, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      INSERT INTO otp_verifications (
        user_id,
        phone,
        purpose,
        code_hash,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING ${OTP_COLUMNS}
      `,
      [
        input.userId,
        input.phone,
        input.purpose,
        input.codeHash,
        input.expiresAt,
      ]
    );

    return result.rows[0];
  }

  async findLatestActive(
    userId: string,
    purpose: string = 'VERIFICATION',
    executor: QueryExecutor = db
  ) {
    const result = await executor.query(
      `
      SELECT ${OTP_COLUMNS}
      FROM otp_verifications
      WHERE user_id = $1
        AND purpose = $2
        AND verified_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId, purpose]
    );

    return result.rows[0] ?? null;
  }

  async incrementAttempts(id: string, executor: QueryExecutor = db) {
    await executor.query(
      `
      UPDATE otp_verifications
      SET attempts = attempts + 1
      WHERE id = $1
      `,
      [id]
    );
  }

  async markVerified(id: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      UPDATE otp_verifications
      SET verified_at = NOW()
      WHERE id = $1
      RETURNING ${OTP_COLUMNS}
      `,
      [id]
    );

    return result.rows[0] ?? null;
  }
}
