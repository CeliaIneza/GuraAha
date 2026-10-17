import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface CreateListingPhotoInput {
    listingId: string;
    filePath: string;
    sortOrder?: number;
}

export class ListingPhotoRepository {
    async create(input: CreateListingPhotoInput, executor: QueryExecutor = db) {
        const result = await executor.query(
            `
            INSERT INTO listing_photos (listing_id, file_path, sort_order)
            VALUES {$1, $2, $3}
            RETURNING id, listing_id, file_path, sort_order, created_at
            `,
            [input.listingId, input.filePath, input.sortOrder ?? 0]
        );
        return result.rows[0];
    }

    async findByListingId(listingId: string, executor: QueryExecutor = db) {
        const result = await executor.query(
            `
            SELECT id, listing_id, file_path, sort_order, created_at
            FROM listing_photos
            WHERE listing_id = $1
            ORDER BY sort_order ASC, created_at ASC
            `,
            [listingId]
        );
        return result.rows;
    }

    async findById(id: string, executor: QueryExecutor = db) {
        const result = await executor.query(
            `
            SELECT id, listing_id, file_path, sort_order, created_at
            FROM listing_photos
            WHERE id = $1
            `,
            [id]
        );
        return result.rows[0] ?? null;
    }

    async deleteById(id: string, executor: QueryExecutor = db) {
        await executor.query('DELETE FROM listing_photos WHERE id = $1', [id]);
    }
}