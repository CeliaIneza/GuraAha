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
}