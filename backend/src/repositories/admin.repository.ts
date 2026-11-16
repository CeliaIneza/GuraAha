import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class AdminRepository {
  async findAllBlockers(
    params: PaginationParams = {},
    executor: QueryExecutor = db
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.status && params.status !== 'ALL') {
      values.push(params.status.toUpperCase());
      conditions.push(`bp.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await executor.query(
      `
      SELECT COUNT(*)::int AS total
      FROM blocker_profiles bp
      INNER JOIN users u ON u.id = bp.user_id
      ${whereClause}
      `,
      values
    );
    const total = countResult.rows[0]?.total || 0;

    values.push(limit);
    const limitParam = `$${values.length}`;
    values.push(offset);
    const offsetParam = `$${values.length}`;

    const queryResult = await executor.query(
      `
      SELECT
        bp.id,
        bp.user_id,
        bp.national_id,
        bp.operating_location_id,
        bp.verification_code,
        bp.status,
        bp.rejection_reason,
        bp.reviewed_by,
        bp.reviewed_at,
        bp.approved_at,
        bp.created_at,
        bp.updated_at,
        u.phone,
        u.email,
        u.first_name,
        u.last_name,
        loc.name AS operating_location_name
      FROM blocker_profiles bp
      INNER JOIN users u ON u.id = bp.user_id
      LEFT JOIN locations loc ON loc.id = bp.operating_location_id
      ${whereClause}
      ORDER BY bp.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
      `,
      values
    );

    return {
      data: queryResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findAllListings(
    params: PaginationParams = {},
    executor: QueryExecutor = db
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.status && params.status !== 'ALL') {
      values.push(params.status.toUpperCase());
      conditions.push(`l.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await executor.query(
      `
      SELECT COUNT(*)::int AS total
      FROM listings l
      INNER JOIN blocker_profiles bp ON bp.id = l.blocker_id
      INNER JOIN users u ON u.id = bp.user_id
      ${whereClause}
      `,
      values
    );
    const total = countResult.rows[0]?.total || 0;

    values.push(limit);
    const limitParam = `$${values.length}`;
    values.push(offset);
    const offsetParam = `$${values.length}`;

    const queryResult = await executor.query(
      `
      SELECT
        l.id,
        l.blocker_id,
        l.village_id,
        l.type,
        COALESCE(l.title_en, l.title_rw, l.title_fr) AS title,
        l.title_en,
        l.title_rw,
        l.title_fr,
        l.price_rwf,
        l.size_value,
        l.size_unit,
        l.upi_number,
        l.owner_name,
        l.owner_phone,
        l.status,
        l.rejection_reason,
        l.reviewed_by,
        l.reviewed_at,
        l.created_at,
        l.updated_at,
        u.first_name AS blocker_first_name,
        u.last_name AS blocker_last_name,
        u.phone AS blocker_phone
      FROM listings l
      INNER JOIN blocker_profiles bp ON bp.id = l.blocker_id
      INNER JOIN users u ON u.id = bp.user_id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
      `,
      values
    );

    return {
      data: queryResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findAllSubscriptions(
    params: PaginationParams = {},
    executor: QueryExecutor = db
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.status && params.status !== 'ALL') {
      values.push(params.status.toUpperCase());
      conditions.push(`s.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await executor.query(
      `
      SELECT COUNT(*)::int AS total
      FROM subscriptions s
      INNER JOIN blocker_profiles bp ON bp.id = s.blocker_id
      INNER JOIN users u ON u.id = bp.user_id
      ${whereClause}
      `,
      values
    );
    const total = countResult.rows[0]?.total || 0;

    values.push(limit);
    const limitParam = `$${values.length}`;
    values.push(offset);
    const offsetParam = `$${values.length}`;

    const queryResult = await executor.query(
      `
      SELECT
        s.id,
        s.blocker_id,
        s.plan,
        s.status,
        s.starts_at,
        s.expires_at,
        s.cancelled_at,
        s.created_at,
        s.updated_at,
        u.first_name,
        u.last_name,
        u.phone
      FROM subscriptions s
      INNER JOIN blocker_profiles bp ON bp.id = s.blocker_id
      INNER JOIN users u ON u.id = bp.user_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
      `,
      values
    );

    return {
      data: queryResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
