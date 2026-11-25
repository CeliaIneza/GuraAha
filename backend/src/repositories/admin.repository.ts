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
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 100));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.status && params.status !== "ALL") {
      values.push(params.status.toUpperCase());
      conditions.push(`bp.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
        bp.area_text,
        bp.verification_code,
        bp.agreement_document_path,
        bp.status,
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
        u.last_name,
        loc.name AS operating_location_name,
        loc.level AS operating_location_level,
        loc_parent.name AS operating_parent_name,
        loc_grandparent.name AS operating_grandparent_name,
        COALESCE(
          bp.area_text,
          NULLIF(CONCAT_WS(' → ', loc_grandparent.name, loc_parent.name, loc.name), '')
        ) AS operating_location_path,
        (
          SELECT COUNT(*)::int
          FROM listings l
          WHERE l.blocker_id = bp.id
        ) AS listing_count,
        (
          SELECT CASE
            WHEN s.period = 'WEEK' THEN 'Blocker Pro · Weekly'
            ELSE 'Blocker Pro · Monthly'
          END
          FROM subscriptions s
          WHERE s.blocker_id = bp.id
            AND s.status = 'ACTIVE'
            AND s.expires_at > NOW()
          ORDER BY s.expires_at DESC
          LIMIT 1
        ) AS active_plan
      FROM blocker_profiles bp
      INNER JOIN users u ON u.id = bp.user_id
      LEFT JOIN locations loc ON loc.id = bp.operating_location_id
      LEFT JOIN locations loc_parent ON loc_parent.id = loc.parent_id
      LEFT JOIN locations loc_grandparent ON loc_grandparent.id = loc_parent.parent_id
      ${whereClause}
      ORDER BY
        CASE WHEN bp.status = 'PENDING' THEN 0 ELSE 1 END ASC,
        bp.created_at DESC
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
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 100));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.status && params.status !== "ALL") {
      values.push(params.status.toUpperCase());
      conditions.push(`l.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
        l.category,
        l.sub_type,
        l.condition,
        l.deal,
        l.rental_terms,
        COALESCE(l.title_en, l.title_rw, l.title_fr) AS title,
        l.title_en,
        l.title_rw,
        l.title_fr,
        l.description_en,
        l.description_rw,
        l.description_fr,
        l.price_rwf,
        l.size_value,
        l.size_unit,
        l.upi_number,
        l.owner_name,
        l.owner_phone,
        l.ownership_document_path,
        l.status,
        l.is_featured,
        l.is_disabled,
        l.is_vip,
        l.vip_was_price_rwf,
        l.vip_discount_percent,
        l.vip_reason,
        l.vip_early_access_days,
        l.vip_expires_at,
        l.rejection_reason,
        l.reviewed_by,
        l.reviewed_at,
        l.created_at,
        l.updated_at,
        u.first_name AS blocker_first_name,
        u.last_name AS blocker_last_name,
        u.phone AS blocker_phone,
        u.email AS blocker_email,
        bp.verification_code AS blocker_verification_code,
        bp.status AS blocker_status,
        (
          SELECT COUNT(*)::int
          FROM contact_unlocks cu
          WHERE cu.listing_id = l.id
        ) AS unlock_count,
        (
          SELECT lp.file_path
          FROM listing_photos lp
          WHERE lp.listing_id = l.id
          ORDER BY lp.sort_order ASC, lp.created_at ASC
          LIMIT 1
        ) AS cover_photo_path,
        (
          SELECT COALESCE(jsonb_agg(lp.file_path ORDER BY lp.sort_order ASC, lp.created_at ASC), '[]'::jsonb)
          FROM listing_photos lp
          WHERE lp.listing_id = l.id
        ) AS photos,
        jsonb_build_object(
          'village', loc_vil.name,
          'cell', loc_cel.name,
          'sector', loc_sec.name,
          'district', loc_dis.name,
          'province', loc_pro.name
        ) AS location
      FROM listings l
      INNER JOIN blocker_profiles bp ON bp.id = l.blocker_id
      INNER JOIN users u ON u.id = bp.user_id
      LEFT JOIN locations loc_vil ON loc_vil.id = l.village_id
      LEFT JOIN locations loc_cel ON loc_cel.id = loc_vil.parent_id
      LEFT JOIN locations loc_sec ON loc_sec.id = loc_cel.parent_id
      LEFT JOIN locations loc_dis ON loc_dis.id = loc_sec.parent_id
      LEFT JOIN locations loc_pro ON loc_pro.id = loc_dis.parent_id
      ${whereClause}
      ORDER BY
        CASE WHEN l.status = 'PENDING' THEN 0 ELSE 1 END ASC,
        l.created_at DESC
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
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 100));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.status && params.status !== "ALL") {
      values.push(params.status.toUpperCase());
      conditions.push(`s.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await executor.query(
      `
      SELECT COUNT(*)::int AS total
      FROM subscriptions s
      LEFT JOIN blocker_profiles bp ON bp.id = s.blocker_id
      LEFT JOIN users u ON u.id = COALESCE(s.user_id, bp.user_id)
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
        s.user_id,
        s.blocker_id,
        s.subscription_type,
        s.period,
        s.plan,
        s.status,
        s.starts_at,
        s.expires_at,
        s.cancelled_at,
        s.alert_districts,
        s.subscriber_name,
        s.subscriber_phone,
        s.created_at,
        s.updated_at,
        COALESCE(p.amount_rwf, 0)::int AS amount_rwf,
        COALESCE(s.subscriber_name, NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), '')) AS display_name,
        u.first_name,
        u.last_name,
        COALESCE(s.subscriber_phone, u.phone) AS phone,
        u.email
      FROM subscriptions s
      LEFT JOIN blocker_profiles bp ON bp.id = s.blocker_id
      LEFT JOIN users u ON u.id = COALESCE(s.user_id, bp.user_id)
      LEFT JOIN payments p ON p.id = s.payment_id
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

  async findAllPayments(executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.provider,
        p.provider_reference,
        p.amount_rwf::int AS amount_rwf,
        p.purpose,
        p.status,
        p.metadata,
        p.verified_at,
        p.created_at,
        p.updated_at,
        u.first_name,
        u.last_name,
        u.phone,
        u.email,
        COALESCE(l.title_en, l.title_rw, l.title_fr) AS listing_title
      FROM payments p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN listings l ON l.id::text = (p.metadata->>'listingId')
      ORDER BY p.created_at DESC
      LIMIT 200
      `
    );
    return result.rows;
  }

  async getAuditLogs(limit = 25, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT id, actor_id, action, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit]
    );
    return result.rows;
  }
}
