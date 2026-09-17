import { db } from '../config/database';

export interface CreateBlockerProfileInput {
    userId: string;
    nationalId: string;
    operatingLocationId?: string;
    verificationCode?: string;
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
            [userId]
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
                verification_code,
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
                input.verificationCode ?? null,
                input.agreementDocumentPath ?? null
            ]
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
            [id]
        );
        return result.rows[0] ?? null;
    }

    async findPending() {
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
            WHERE status = 'PENDING'
            ORDER BY created_at ASC
            `
        );
        return result.rows;
    }
}