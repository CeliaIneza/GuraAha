import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface CreateBlockerProfileInput {
  userId: string;
  nationalId: string;
  operatingLocationId?: string;
  agreementDocumentPath?: string;
}

const BLOCKER_PROFILE_COLUMNS = `
  id,
  user_id,
  national_id,
  operating_location_id,
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
    const result = await db.query(
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
    const result = await db.query(
      `
            INSERT INTO blocker_profiles (
                user_id,
                national_id,
                operating_location_id,
                agreement_document_path
            ) VALUES ($1, $2, $3, $4)
            RETURNING ${BLOCKER_PROFILE_COLUMNS}
            `,
      [
        input.userId,
        input.nationalId,
        input.operatingLocationId ?? null,
        input.agreementDocumentPath ?? null,
      ],
    );
    return result.rows[0];
  }

  async findById(id: string, executor: QueryExecutor = db) {
    const result = await db.query(
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
    const result = await db.query(
      `
            SELECT
                bp.id,
                bp.user_id,
                bp.national_id,
                bp.operating_location_id,
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
                u.email
            FROM blocker_profiles bp
            INNER JOIN users u ON u.id = bp.user_id
            WHERE bp.status = 'PENDING'
            ORDER BY created_at ASC
            `,
    );
    return result.rows;
  }

  async approve(
    blockerId: string,
    reviewedBy: string,
    executor: QueryExecutor = db,
  ) {
    const result = await db.query(
      `
            UPDATE blocker_profiles
            SET
                status = 'APPROVED',
                reviewed_by = $1,
                reviewed_at = NOW(),
                approved_at = NOW(),
                rejection_reason = NULL,
                updated_at = NOW()
            WHERE id = $2
              AND status = 'PENDING'
            RETURNING ${BLOCKER_PROFILE_COLUMNS}
            `,
      [reviewedBy, blockerId],
    );

    return result.rows[0] ?? null;
  }

  async reject(
    blockerId: string,
    reviewedBy: string,
    rejectionReason: string,
    executor: QueryExecutor = db,
  ) {
    const result = await db.query(
      `
            UPDATE blocker_profiles
            SET
              status = 'REJECTED',
              rejection_reason = $1,
              reviewed_by = $2,
              reviewed_at = NOW(),
              updated_at = NOW()
            WHERE id = $3
            AND status = 'PENDING'
            RETURNING ${BLOCKER_PROFILE_COLUMNS}
      `,
      [rejectionReason, reviewedBy, blockerId],
    );

    return result.rows[0] ?? null;
  }
}
