import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface PartnerDbRow {
    id: string;
    type: string;
    name: string;
    phone: string | null;
    email: string | null;
    location_id: string | null;
    location_name?: string | null;
    location_level?: string | null;
    description_rw: string | null;
    description_en: string | null;
    description_fr: string | null;
    is_certified: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreatePartnerInput {
    type: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    locationId?: string | null;
    descriptionRw?: string | null;
    descriptionEn?: string | null;
    descriptionFr?: string | null;
    isCertified?: boolean;
    isActive?: boolean;
}

export interface UpdatePartnerInput {
    type?: string;
    name?: string;
    phone?: string | null;
    email?: string | null;
    locationId?: string | null;
    descriptionRw?: string | null;
    descriptionEn?: string | null;
    descriptionFr?: string | null;
    isCertified?: boolean;
    isActive?: boolean;
}

export interface PartnerFilterOptions {
    type?: string;
    locationId?: string;
    isCertified?: boolean;
    isActive?: boolean;
    search?: string;
    limit: number;
    offset: number;
}

export class PartnerRepository {
    async create(input: CreatePartnerInput, executor: QueryExecutor = db): Promise<PartnerDbRow> {
        const result = await executor.query(
            `
            INSERT INTO partners (
                type,
                name,
                phone,
                email,
                location_id,
                description_rw,
                description_en,
                description_fr,
                is_certified,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING
                id,
                type,
                name,
                phone,
                email,
                location_id,
                description_rw,
                description_en,
                description_fr,
                is_certified,
                is_active,
                created_at,
                updated_at
            `,
            [
                input.type,
                input.name,
                input.phone ?? null,
                input.email ?? null,
                input.locationId ?? null,
                input.descriptionRw ?? null,
                input.descriptionEn ?? null,
                input.descriptionFr ?? null,
                input.isCertified ?? false,
                input.isActive ?? true,
            ]
        );
        return result.rows[0];
    }

    async findById(id: string, executor: QueryExecutor = db): Promise<PartnerDbRow | null> {
        const result = await executor.query(
            `
            SELECT 
                p.id,
                p.type,
                p.name,
                p.phone,
                p.email,
                p.location_id,
                l.name AS location_name,
                l.level AS location_level,
                p.description_rw,
                p.description_en,
                p.description_fr,
                p.is_certified,
                p.is_active,
                p.created_at,
                p.updated_at
            FROM partners p
            LEFT JOIN locations l ON p.location_id = l.id
            WHERE p.id = $1
            LIMIT 1
            `,
            [id]
        );
        return result.rows[0] ?? null;
    }

    async findMany(filters: PartnerFilterOptions, executor: QueryExecutor = db): Promise<{ items: PartnerDbRow[]; total: number }> {
        const conditions: string[] = [];
        const params: any[] = [];

        if (filters.type) {
            params.push(filters.type);
            conditions.push(`p.type = $${params.length}`);
        }

        if (filters.locationId) {
            params.push(filters.locationId);
            conditions.push(`p.location_id = $${params.length}`);
        }

        if (filters.isCertified !== undefined) {
            params.push(filters.isCertified);
            conditions.push(`p.is_certified = $${params.length}`);
        }

        if (filters.isActive !== undefined) {
            params.push(filters.isActive);
            conditions.push(`p.is_active = $${params.length}`);
        }

        if (filters.search) {
            params.push(`%${filters.search}%`);
            const pIdx = params.length;
            conditions.push(`(p.name ILIKE $${pIdx} OR p.description_rw ILIKE $${pIdx} OR p.description_en ILIKE $${pIdx} OR p.description_fr ILIKE $${pIdx})`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countQuery = `SELECT COUNT(*)::int AS total FROM partners p ${whereClause}`;
        const countResult = await executor.query(countQuery, params);
        const total = countResult.rows[0]?.total ?? 0;

        params.push(filters.limit);
        const limitParamIndex = params.length;
        params.push(filters.offset);
        const offsetParamIndex = params.length;

        const dataQuery = `
            SELECT 
                p.id,
                p.type,
                p.name,
                p.phone,
                p.email,
                p.location_id,
                l.name AS location_name,
                l.level AS location_level,
                p.description_rw,
                p.description_en,
                p.description_fr,
                p.is_certified,
                p.is_active,
                p.created_at,
                p.updated_at
            FROM partners p
            LEFT JOIN locations l ON p.location_id = l.id
            ${whereClause}
            ORDER BY p.is_certified DESC, p.name ASC
            LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
        `;

        const dataResult = await executor.query(dataQuery, params);
        return { items: dataResult.rows, total };
    }

    async update(id: string, input: UpdatePartnerInput, executor: QueryExecutor = db): Promise<PartnerDbRow | null> {
        const fields: string[] = [];
        const params: any[] = [id];

        if (input.type !== undefined) {
            params.push(input.type);
            fields.push(`type = $${params.length}`);
        }
        if (input.name !== undefined) {
            params.push(input.name);
            fields.push(`name = $${params.length}`);
        }
        if (input.phone !== undefined) {
            params.push(input.phone);
            fields.push(`phone = $${params.length}`);
        }
        if (input.email !== undefined) {
            params.push(input.email);
            fields.push(`email = $${params.length}`);
        }
        if (input.locationId !== undefined) {
            params.push(input.locationId);
            fields.push(`location_id = $${params.length}`);
        }
        if (input.descriptionRw !== undefined) {
            params.push(input.descriptionRw);
            fields.push(`description_rw = $${params.length}`);
        }
        if (input.descriptionEn !== undefined) {
            params.push(input.descriptionEn);
            fields.push(`description_en = $${params.length}`);
        }
        if (input.descriptionFr !== undefined) {
            params.push(input.descriptionFr);
            fields.push(`description_fr = $${params.length}`);
        }
        if (input.isCertified !== undefined) {
            params.push(input.isCertified);
            fields.push(`is_certified = $${params.length}`);
        }
        if (input.isActive !== undefined) {
            params.push(input.isActive);
            fields.push(`is_active = $${params.length}`);
        }

        if (fields.length === 0) {
            return this.findById(id, executor);
        }

        fields.push("updated_at = NOW()");

        const query = `
            UPDATE partners
            SET ${fields.join(", ")}
            WHERE id = $1
            RETURNING
                id,
                type,
                name,
                phone,
                email,
                location_id,
                description_rw,
                description_en,
                description_fr,
                is_certified,
                is_active,
                created_at,
                updated_at
        `;

        const result = await executor.query(query, params);
        return result.rows[0] ?? null;
    }

    async softDelete(id: string, executor: QueryExecutor = db): Promise<boolean> {
        const result = await executor.query(
            `
            UPDATE partners
            SET is_active = FALSE, updated_at = NOW()
            WHERE id = $1
            `,
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async delete(id: string, executor: QueryExecutor = db): Promise<boolean> {
        const result = await executor.query(
            `
            DELETE FROM partners
            WHERE id = $1
            `,
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    }
}
