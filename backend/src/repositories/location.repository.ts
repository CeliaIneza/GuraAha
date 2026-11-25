import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

const LOCATION_COLUMNS = `
  id,
  parent_id,
  level,
  name,
  code,
  is_active
`;

export class LocationRepository {
    async findRoots(executor: QueryExecutor = db) {
        const result = await executor.query(
            `
                SELECT ${LOCATION_COLUMNS}
                FROM locations
                WHERE parent_id IS NULL
                    AND is_active = TRUE
                ORDER BY name ASC
            `
        );
        return result.rows;
    }

    async findById(id: string, executor: QueryExecutor = db) {
        const result = await executor.query(
            `
            SELECT ${LOCATION_COLUMNS}
            FROM locations
            WHERE id = $1
            `,
            [id]
        );
        return result.rows[0] ?? null;
    }

    async findChildren(parentId: string, executor: QueryExecutor = db) {
        const result = await executor.query(
            `
                SELECT ${LOCATION_COLUMNS}
                FROM locations
                WHERE parent_id = $1
                 AND is_active = TRUE
                ORDER BY name ASC
            `,
            [parentId]
        );
        return result.rows;
    }

    async getAreaHighlights(executor: QueryExecutor = db) {
        const result = await executor.query(
            `
            SELECT
                d.id AS district_id,
                d.name AS district_name,
                p.name AS province_name,
                ah.highlights_en,
                ah.highlights_rw,
                ah.highlights_fr,
                ah.updated_at,
                (
                    SELECT COUNT(*)::int
                    FROM listings l
                    INNER JOIN locations vil ON vil.id = l.village_id
                    INNER JOIN locations cel ON cel.id = vil.parent_id
                    INNER JOIN locations sec ON sec.id = cel.parent_id
                    WHERE sec.parent_id = d.id
                      AND l.status = 'APPROVED'
                      AND l.is_disabled = FALSE
                ) AS live_listings_count
            FROM locations d
            INNER JOIN locations p ON p.id = d.parent_id
            LEFT JOIN area_highlights ah ON LOWER(ah.district_name) = LOWER(d.name)
            WHERE d.level = 'DISTRICT' AND d.is_active = TRUE
            ORDER BY p.name ASC, d.name ASC
            `
        );
        const customRows = await executor.query(
            `SELECT * FROM area_highlights ORDER BY district_name ASC`
        );
        return {
            districts: result.rows,
            highlights: customRows.rows,
        };
    }

    async upsertAreaHighlight(
        districtName: string,
        input: {
            provinceName?: string;
            highlightsEn: string;
            highlightsRw?: string;
            highlightsFr?: string;
            updatedBy?: string;
        },
        executor: QueryExecutor = db
    ) {
        const result = await executor.query(
            `
            INSERT INTO area_highlights (district_name, province_name, highlights_en, highlights_rw, highlights_fr, updated_by, updated_at)
            VALUES ($1, COALESCE($2, 'Kigali City'), $3, $4, $5, $6, NOW())
            ON CONFLICT (district_name) DO UPDATE
            SET
                province_name = COALESCE($2, area_highlights.province_name),
                highlights_en = EXCLUDED.highlights_en,
                highlights_rw = COALESCE($4, area_highlights.highlights_rw),
                highlights_fr = COALESCE($5, area_highlights.highlights_fr),
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
            RETURNING *
            `,
            [
                districtName.trim(),
                input.provinceName?.trim() || null,
                input.highlightsEn.trim(),
                input.highlightsRw?.trim() || null,
                input.highlightsFr?.trim() || null,
                input.updatedBy || null,
            ]
        );
        return result.rows[0];
    }

    async addDistrict(provinceIdOrName: string, districtName: string, executor: QueryExecutor = db) {
        const provRes = await executor.query(
            `SELECT id, name FROM locations WHERE level = 'PROVINCE' AND (id::text = $1 OR LOWER(name) = LOWER($1)) LIMIT 1`,
            [provinceIdOrName.trim()]
        );
        const prov = provRes.rows[0];
        if (!prov) {
            throw new Error('Province not found');
        }
        const existing = await executor.query(
            `SELECT id FROM locations WHERE level = 'DISTRICT' AND LOWER(name) = LOWER($1) LIMIT 1`,
            [districtName.trim()]
        );
        if (existing.rows[0]) {
            throw new Error('That district already exists');
        }
        const created = await executor.query(
            `
            INSERT INTO locations (parent_id, level, name, is_active)
            VALUES ($1, 'DISTRICT', $2, TRUE)
            RETURNING ${LOCATION_COLUMNS}
            `,
            [prov.id, districtName.trim()]
        );
        return { ...created.rows[0], province_name: prov.name };
    }
}