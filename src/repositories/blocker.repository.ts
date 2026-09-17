import { db } from "../config/database";

export interface CreateBlockerProfileInput {
  userId: string;
  nationalId: string;
  operatingLocationId?: string;
  agreementDocumentPath?: string;
}

export class BlockerRepository {
  async findByUserId(userId: string) {
    const result = await db.query(
      `
            SELECT
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
            FROM blocker_profiles
            WHERE user_id = $1
            `,
      [userId],
    );

    return result.rows[0] ?? null;
  }

  async create(input: CreateBlockerProfileInput) {
    const result = await db.query(
      `
            INSERT INTO blocker_profiles (
                user_id,
                national_id,
                operating_location_id,
                agreement_document_path
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING 
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

  async findById(id: string) {
    const result = await db.query(
      `
            SELECT
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
            FROM blocker_profiles
            WHERE id = $1
            `,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findPending() {
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

  async updateApproval(
    blockerId: string,
    reviewedBy: string,
    verificationCode: string,
  ) {
    const result = await db.query(
      `
            UPDATE blocker_profiles
            SET
                status = 'APPROVED',
                verification_code = $1,
                reviewed_by = $2,
                reviewed_at = NOW(),
                approved_at = NOW(),
                rejection_reason = NULL,
                updated_at = NOW()
            WHERE id = $3
              AND status = 'PENDING'
            RETURNING
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
            `,
      [verificationCode, reviewedBy, blockerId],
    );

    return result.rows[0] ?? null;
  }

  async reject(blockerId: string, reviewedBy: string, rejectionReason: string) {
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
     RETURNING
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
      `,
      [rejectionReason, reviewedBy, blockerId]
    );
  }
}
