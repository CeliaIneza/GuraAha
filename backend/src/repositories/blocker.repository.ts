import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface CreateBlockerProfileInput {
  userId: string;
  nationalId: string;
  operatingLocationId?: string | null;
  areaText?: string | null;
  agreementDocumentPath?: string | null;
  status?: string;
  verificationCode?: string | null;
}

const BLOCKER_PROFILE_COLUMNS = `
  id,
  user_id,
  national_id,
  operating_location_id,
  area_text,
  verification_code,
  status,
  agreement_document_path,
  rejection_reason,
  reviewed_by,
  reviewed_at,
  approved_at,
  created_at,
  updated_at
`;

export class BlockerRepository {
  async findByUserId(userId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
            SELECT ${BLOCKER_PROFILE_COLUMNS}
            FROM blocker_profiles
            WHERE user_id = $1
            `,
      [userId],
    );

    return result.rows[0] ?? null;
  }

  async create(input: CreateBlockerProfileInput, executor: QueryExecutor = db) {
    const status = (input.status || "PENDING").toUpperCase();
    const isUuid =
      input.operatingLocationId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        input.operatingLocationId
      );

    const result = await executor.query(
      `
            INSERT INTO blocker_profiles (
                user_id,
                national_id,
                operating_location_id,
                area_text,
                agreement_document_path,
                status,
                verification_code,
                approved_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $6 = 'APPROVED' THEN NOW() ELSE NULL END)
            ON CONFLICT (user_id) DO UPDATE
            SET
                national_id = EXCLUDED.national_id,
                operating_location_id = COALESCE(EXCLUDED.operating_location_id, blocker_profiles.operating_location_id),
                area_text = COALESCE(EXCLUDED.area_text, blocker_profiles.area_text),
                agreement_document_path = COALESCE(EXCLUDED.agreement_document_path, blocker_profiles.agreement_document_path),
                status = EXCLUDED.status,
                verification_code = COALESCE(blocker_profiles.verification_code, EXCLUDED.verification_code),
                rejection_reason = NULL,
                updated_at = NOW()
            RETURNING ${BLOCKER_PROFILE_COLUMNS}
            `,
      [
        input.userId,
        input.nationalId,
        isUuid ? input.operatingLocationId : null,
        input.areaText ?? (!isUuid && input.operatingLocationId ? input.operatingLocationId : null),
        input.agreementDocumentPath ?? null,
        status,
        input.verificationCode ?? null,
      ],
    );
    return result.rows[0];
  }

  async findById(id: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
            SELECT ${BLOCKER_PROFILE_COLUMNS}
            FROM blocker_profiles
            WHERE id = $1
            `,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findPending(executor: QueryExecutor = db) {
    const result = await executor.query(
      `
            SELECT
                bp.id,
                bp.user_id,
                bp.national_id,
                bp.operating_location_id,
                bp.area_text,
                bp.verification_code,
                bp.status,
                bp.agreement_document_path,
                bp.rejection_reason,
                bp.reviewed_by,
                bp.reviewed_at,
                bp.approved_at,
                bp.created_at,
                bp.updated_at,
                u.phone,
                u.email,
                u.username,
                u.must_change_password,
                u.last_login_at,
                u.first_name,
                u.last_name
            FROM blocker_profiles bp
            INNER JOIN users u ON u.id = bp.user_id
            WHERE bp.status = 'PENDING'
            ORDER BY bp.created_at ASC
            `,
    );
    return result.rows;
  }

  async approve(
    blockerId: string,
    reviewedBy: string,
    verificationCode: string,
    executor: QueryExecutor = db,
  ) {
    const result = await executor.query(
      `
            UPDATE blocker_profiles
            SET
                status = 'APPROVED',
                verification_code = COALESCE(verification_code, $3),
                reviewed_by = $1,
                reviewed_at = NOW(),
                approved_at = COALESCE(approved_at, NOW()),
                rejection_reason = NULL,
                updated_at = NOW()
            WHERE id = $2
            RETURNING ${BLOCKER_PROFILE_COLUMNS}
            `,
      [reviewedBy, blockerId, verificationCode],
    );

    return result.rows[0] ?? null;
  }

  async reject(
    blockerId: string,
    reviewedBy: string,
    rejectionReason: string,
    executor: QueryExecutor = db,
  ) {
    const result = await executor.query(
      `
            UPDATE blocker_profiles
            SET
              status = 'REJECTED',
              rejection_reason = $1,
              reviewed_by = $2,
              reviewed_at = NOW(),
              updated_at = NOW()
            WHERE id = $3
            RETURNING ${BLOCKER_PROFILE_COLUMNS}
      `,
      [rejectionReason, reviewedBy, blockerId],
    );

    return result.rows[0] ?? null;
  }

  async setStatus(
    blockerId: string,
    status: 'APPROVED' | 'SUSPENDED' | 'PENDING' | 'REJECTED',
    reviewedBy: string,
    executor: QueryExecutor = db,
  ) {
    const result = await executor.query(
      `
      UPDATE blocker_profiles
      SET
        status = $1,
        reviewed_by = $2,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING ${BLOCKER_PROFILE_COLUMNS}
      `,
      [status, reviewedBy, blockerId],
    );
    return result.rows[0] ?? null;
  }

  async revise(
    blockerId: string,
    reviewedBy: string,
    adminNote: string,
    executor: QueryExecutor = db,
  ) {
    const result = await executor.query(
      `
            UPDATE blocker_profiles
            SET
              status = 'PENDING',
              rejection_reason = $1,
              reviewed_by = $2,
              reviewed_at = NOW(),
              updated_at = NOW()
            WHERE id = $3
            RETURNING ${BLOCKER_PROFILE_COLUMNS}
      `,
      [adminNote, reviewedBy, blockerId],
    );

    return result.rows[0] ?? null;
  }

  async countListingsByBlockerId(blockerId: string, executor: QueryExecutor = db): Promise<number> {
    const res = await executor.query(
      `SELECT COUNT(*)::int AS total FROM listings WHERE blocker_id = $1`,
      [blockerId]
    );
    return res.rows[0]?.total || 0;
  }

  async deleteById(blockerId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `DELETE FROM blocker_profiles WHERE id = $1 RETURNING ${BLOCKER_PROFILE_COLUMNS}`,
      [blockerId],
    );
    return result.rows[0] ?? null;
  }
}
