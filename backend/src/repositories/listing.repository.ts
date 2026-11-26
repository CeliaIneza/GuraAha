import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface CreateListingInput {
  blockerId: string;
  villageId: string;
  type: string;
  category?: string;
  subType?: string;
  condition?: string;
  deal?: string;
  rentalTerms?: string | null;
  titleRw?: string;
  titleEn?: string;
  titleFr?: string;
  descriptionRw?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  priceRwf: number;
  sizeValue: number;
  sizeUnit: string;
  upiNumber?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownershipDocumentPath?: string | null;
  status?: string;
  isFeatured?: boolean;
  isDisabled?: boolean;
  isVip?: boolean;
  vipWasPriceRwf?: number | null;
  vipDiscountPercent?: number | null;
  vipReason?: string | null;
  vipEarlyAccessDays?: number | null;
}

export interface UpdateListingInput {
  blockerId?: string;
  villageId?: string;
  titleRw?: string | null;
  titleEn?: string | null;
  titleFr?: string | null;
  descriptionRw?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  priceRwf?: number;
  sizeValue?: number;
  sizeUnit?: string;
  upiNumber?: string | null;
  type?: string;
  category?: string | null;
  subType?: string | null;
  condition?: string | null;
  deal?: string;
  rentalTerms?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownershipDocumentPath?: string | null;
  status?: string;
  isFeatured?: boolean;
  isDisabled?: boolean;
  isVip?: boolean;
  vipWasPriceRwf?: number | null;
  vipDiscountPercent?: number | null;
  vipReason?: string | null;
  vipEarlyAccessDays?: number | null;
}

export interface ListingFilters {
  villageId?: string;
  locationId?: string;
  districtId?: string;
  province?: string;
  district?: string;
  type?: string;
  category?: string;
  subType?: string;
  deal?: string;
  isFeatured?: boolean;
  sort?: string;
  maxPrice?: number;
  minPrice?: number;
  isVipOnly?: boolean;
  limit: number;
  offset: number;
}

const LISTING_COLUMNS = `
  id,
  blocker_id,
  village_id,
  type,
  category,
  sub_type,
  condition,
  deal,
  rental_terms,
  title_rw,
  title_en,
  title_fr,
  description_rw,
  description_en,
  description_fr,
  price_rwf,
  size_value,
  size_unit,
  upi_number,
  owner_name,
  owner_phone,
  ownership_document_path,
  status,
  is_featured,
  is_vip,
  vip_was_price_rwf,
  vip_discount_percent,
  vip_reason,
  vip_early_access_days,
  vip_expires_at,
  is_disabled,
  rejection_reason,
  reviewed_by,
  reviewed_at,
  approved_at,
  created_at,
  updated_at
`;

const ENRICHED_LISTING_SELECT = `
  l.id,
  l.blocker_id,
  l.village_id,
  l.type,
  l.category,
  l.sub_type,
  l.condition,
  l.deal,
  l.rental_terms,
  l.title_rw,
  l.title_en,
  l.title_fr,
  l.description_rw,
  l.description_en,
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
  l.is_vip,
  l.vip_was_price_rwf,
  l.vip_discount_percent,
  l.vip_reason,
  l.vip_early_access_days,
  l.vip_expires_at,
  l.is_disabled,
  l.rejection_reason,
  l.reviewed_by,
  l.reviewed_at,
  l.approved_at,
  l.created_at,
  l.updated_at,
  bp.user_id AS owner_user_id,
  bp.status AS blocker_status,
  (
    SELECT lp.file_path
    FROM listing_photos lp
    WHERE lp.listing_id = l.id
    ORDER BY lp.sort_order ASC, lp.created_at ASC
    LIMIT 1
  ) AS cover_photo_path,
  (
    SELECT COUNT(*)::int
    FROM contact_unlocks cu
    WHERE cu.listing_id = l.id
  ) AS unlock_count,
  jsonb_build_object(
    'village', loc_vil.name,
    'cell', loc_cel.name,
    'sector', loc_sec.name,
    'district', loc_dis.name,
    'province', loc_pro.name
  ) AS location,
  jsonb_build_object(
    'id', bp.id,
    'firstName', u.first_name,
    'lastName', u.last_name,
    'verificationCode', bp.verification_code,
    'status', bp.status
  ) AS blocker,
  ah.highlights_en AS area_highlights_en,
  ah.highlights_rw AS area_highlights_rw,
  ah.highlights_fr AS area_highlights_fr
`;

const ENRICHED_LISTING_JOINS = `
  FROM listings l
  INNER JOIN blocker_profiles bp ON bp.id = l.blocker_id
  LEFT JOIN users u ON u.id = bp.user_id
  LEFT JOIN locations loc_vil ON loc_vil.id = l.village_id
  LEFT JOIN locations loc_cel ON loc_cel.id = loc_vil.parent_id
  LEFT JOIN locations loc_sec ON loc_sec.id = loc_cel.parent_id
  LEFT JOIN locations loc_dis ON loc_dis.id = loc_sec.parent_id
  LEFT JOIN locations loc_pro ON loc_pro.id = loc_dis.parent_id
  LEFT JOIN area_highlights ah ON LOWER(ah.district_name) = LOWER(loc_dis.name)
`;

export class ListingRepository {
  async create(input: CreateListingInput, executor: QueryExecutor = db) {
    const isVip = Boolean(input.isVip);
    let discountPercent = input.vipDiscountPercent ?? null;
    if (isVip && input.vipWasPriceRwf && input.vipWasPriceRwf > input.priceRwf && !discountPercent) {
      discountPercent = Number((((input.vipWasPriceRwf - input.priceRwf) / input.vipWasPriceRwf) * 100).toFixed(2));
    }

    const deal = (input.deal || "sale").toLowerCase() === "rent" ? "rent" : "sale";
    const status = (input.status || "PENDING").toUpperCase();
    const earlyDays = input.vipEarlyAccessDays ?? 7;
    const isApproved = status === "APPROVED";
    const approvedAt = isApproved ? new Date() : null;
    const vipExpiresAt =
      isVip && isApproved
        ? new Date(Date.now() + earlyDays * 24 * 60 * 60 * 1000)
        : null;

    const result = await executor.query(
      `
      INSERT INTO listings (
        blocker_id, village_id, type, category, sub_type, condition, deal, rental_terms,
        title_rw, title_en, title_fr,
        description_rw, description_en, description_fr,
        price_rwf, size_value, size_unit,
        upi_number, owner_name, owner_phone, ownership_document_path,
        status, is_featured, is_disabled,
        is_vip, vip_was_price_rwf, vip_discount_percent, vip_reason, vip_early_access_days,
        vip_expires_at, approved_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23, $24,
        $25, $26, $27, $28, $29,
        $30, $31
      )
      RETURNING ${LISTING_COLUMNS}
      `,
      [
        input.blockerId,
        input.villageId,
        input.type || input.subType || input.category || "Land and Plots",
        input.category ?? input.type ?? "Land and Plots",
        input.subType ?? input.type ?? input.category ?? "Land and Plots",
        input.condition ?? "Ready / finished",
        deal,
        input.rentalTerms ?? null,
        input.titleRw ?? null,
        input.titleEn ?? null,
        input.titleFr ?? null,
        input.descriptionRw ?? null,
        input.descriptionEn ?? null,
        input.descriptionFr ?? null,
        input.priceRwf,
        input.sizeValue,
        input.sizeUnit,
        input.upiNumber ?? null,
        input.ownerName ?? null,
        input.ownerPhone ?? null,
        input.ownershipDocumentPath ?? null,
        status,
        Boolean(input.isFeatured),
        Boolean(input.isDisabled),
        isVip,
        input.vipWasPriceRwf ?? null,
        discountPercent,
        input.vipReason ?? null,
        earlyDays,
        vipExpiresAt,
        approvedAt,
      ]
    );
    return result.rows[0];
  }

  async findById(id: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${ENRICHED_LISTING_SELECT}
      ${ENRICHED_LISTING_JOINS}
      WHERE l.id = $1
      `,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByIdWithOwner(id: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${ENRICHED_LISTING_SELECT}
      ${ENRICHED_LISTING_JOINS}
      WHERE l.id = $1
      `,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByBlockerId(blockerId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${ENRICHED_LISTING_SELECT}
      ${ENRICHED_LISTING_JOINS}
      WHERE l.blocker_id = $1
      ORDER BY l.created_at DESC
      `,
      [blockerId]
    );
    return result.rows;
  }

  async findPending(executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${ENRICHED_LISTING_SELECT}
      ${ENRICHED_LISTING_JOINS}
      WHERE l.status = 'PENDING'
      ORDER BY l.created_at ASC
      `
    );
    return result.rows;
  }

  async findPendingVip(executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${ENRICHED_LISTING_SELECT}
      ${ENRICHED_LISTING_JOINS}
      WHERE l.status = 'PENDING' AND l.is_vip = TRUE
      ORDER BY l.created_at ASC
      `
    );
    return result.rows;
  }

  async findApproved(filters: ListingFilters, isVipUser: boolean = false, executor: QueryExecutor = db) {
    const conditions: string[] = [
      `l.status = 'APPROVED'`,
      `l.is_disabled = FALSE`,
      `bp.status <> 'SUSPENDED'`,
    ];
    const values: unknown[] = [];

    if (!isVipUser) {
      conditions.push(`(l.is_vip = FALSE OR l.vip_expires_at IS NULL OR l.vip_expires_at <= NOW())`);
    }

    if (filters.villageId) {
      values.push(filters.villageId);
      conditions.push(`l.village_id = $${values.length}`);
    }

    if (filters.locationId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        filters.locationId
      );
      if (isUuid) {
        values.push(filters.locationId);
        const paramIdx = `$${values.length}`;
        conditions.push(
          `(${paramIdx}::uuid IN (l.village_id, loc_cel.id, loc_sec.id, loc_dis.id, loc_pro.id))`
        );
      } else {
        values.push(filters.locationId);
        const paramIdx = `$${values.length}`;
        conditions.push(
          `LOWER(${paramIdx}) IN (LOWER(loc_vil.name), LOWER(loc_cel.name), LOWER(loc_sec.name), LOWER(loc_dis.name), LOWER(loc_pro.name))`
        );
      }
    }

    if (filters.deal) {
      values.push(filters.deal.toLowerCase());
      conditions.push(`LOWER(COALESCE(l.deal, 'sale')) = $${values.length}`);
    }

    if (filters.isFeatured !== undefined) {
      values.push(Boolean(filters.isFeatured));
      conditions.push(`l.is_featured = $${values.length}`);
    }

    if (filters.category) {
      values.push(filters.category);
      const idx = `$${values.length}`;
      conditions.push(
        `(LOWER(l.category) = LOWER(${idx}) OR LOWER(l.type) = LOWER(${idx}))`
      );
    }

    if (filters.subType) {
      values.push(filters.subType);
      const idx = `$${values.length}`;
      conditions.push(
        `(LOWER(l.sub_type) = LOWER(${idx}) OR LOWER(l.type) = LOWER(${idx}))`
      );
    }

    if (filters.type && !filters.category && !filters.subType) {
      values.push(filters.type);
      const idx = `$${values.length}`;
      conditions.push(
        `(LOWER(l.type) = LOWER(${idx}) OR LOWER(l.category) = LOWER(${idx}) OR LOWER(l.sub_type) = LOWER(${idx}))`
      );
    }

    if (filters.maxPrice) {
      values.push(filters.maxPrice);
      conditions.push(`l.price_rwf <= $${values.length}`);
    }

    if (filters.minPrice) {
      values.push(filters.minPrice);
      conditions.push(`l.price_rwf >= $${values.length}`);
    }

    let orderBy = `l.created_at DESC`;
    if (filters.sort === "lo") {
      orderBy = `l.price_rwf ASC, l.created_at DESC`;
    } else if (filters.sort === "hi") {
      orderBy = `l.price_rwf DESC, l.created_at DESC`;
    } else if (filters.sort === "sale") {
      orderBy = `CASE WHEN LOWER(COALESCE(l.deal, 'sale')) = 'sale' THEN 0 ELSE 1 END ASC, l.created_at DESC`;
    } else if (filters.sort === "rent") {
      orderBy = `CASE WHEN LOWER(COALESCE(l.deal, 'sale')) = 'rent' THEN 0 ELSE 1 END ASC, l.created_at DESC`;
    }

    values.push(filters.limit);
    const limitParam = `$${values.length}`;
    values.push(filters.offset);
    const offsetParam = `$${values.length}`;

    const result = await executor.query(
      `
      SELECT ${ENRICHED_LISTING_SELECT}
      ${ENRICHED_LISTING_JOINS}
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT ${limitParam} OFFSET ${offsetParam}
      `,
      values
    );
    return result.rows;
  }

  async findVipDeals(filters: { limit: number; offset: number }, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${ENRICHED_LISTING_SELECT}
      ${ENRICHED_LISTING_JOINS}
      WHERE l.is_vip = TRUE
        AND l.status = 'APPROVED'
        AND l.is_disabled = FALSE
        AND bp.status <> 'SUSPENDED'
        AND (l.vip_expires_at IS NULL OR l.vip_expires_at > NOW())
      ORDER BY l.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [filters.limit, filters.offset]
    );
    return result.rows;
  }

  async findActiveByUpiNumber(upiNumber: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${LISTING_COLUMNS}
      FROM listings
      WHERE upi_number = $1
        AND status IN ('PENDING', 'APPROVED')
      `,
      [upiNumber]
    );
    return result.rows[0] ?? null;
  }

  async approve(listingId: string, reviewedBy: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      UPDATE listings
      SET
        status = 'APPROVED',
        is_disabled = FALSE,
        reviewed_by = $1,
        reviewed_at = NOW(),
        approved_at = NOW(),
        rejection_reason = NULL,
        updated_at = NOW()
      WHERE id = $2
      RETURNING ${LISTING_COLUMNS}
      `,
      [reviewedBy, listingId]
    );
    return result.rows[0] ?? null;
  }

  async approveVip(listingId: string, reviewedBy: string, earlyAccessDays: number = 7, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      UPDATE listings
      SET
        status = 'APPROVED',
        is_disabled = FALSE,
        is_vip = TRUE,
        vip_early_access_days = $1,
        vip_expires_at = NOW() + ($1::int * INTERVAL '1 day'),
        reviewed_by = $2,
        reviewed_at = NOW(),
        approved_at = NOW(),
        rejection_reason = NULL,
        updated_at = NOW()
      WHERE id = $3
      RETURNING ${LISTING_COLUMNS}
      `,
      [earlyAccessDays, reviewedBy, listingId]
    );
    return result.rows[0] ?? null;
  }

  async reject(
    listingId: string,
    reviewedBy: string,
    rejectionReason: string,
    executor: QueryExecutor = db
  ) {
    const result = await executor.query(
      `
      UPDATE listings
      SET
        status = 'REJECTED',
        rejection_reason = $1,
        reviewed_by = $2,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING ${LISTING_COLUMNS}
      `,
      [rejectionReason, reviewedBy, listingId]
    );
    return result.rows[0] ?? null;
  }

  async revise(
    listingId: string,
    reviewedBy: string,
    adminNote: string,
    executor: QueryExecutor = db
  ) {
    const result = await executor.query(
      `
      UPDATE listings
      SET
        status = 'PENDING',
        rejection_reason = $1,
        reviewed_by = $2,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING ${LISTING_COLUMNS}
      `,
      [adminNote, reviewedBy, listingId]
    );
    return result.rows[0] ?? null;
  }

  async toggleDisabled(listingId: string, blockerId?: string, executor: QueryExecutor = db) {
    const conditions = [`id = $1`];
    const params: unknown[] = [listingId];
    if (blockerId) {
      params.push(blockerId);
      conditions.push(`blocker_id = $2`);
    }

    const result = await executor.query(
      `
      UPDATE listings
      SET
        is_disabled = NOT is_disabled,
        updated_at = NOW()
      WHERE ${conditions.join(" AND ")}
      RETURNING ${LISTING_COLUMNS}
      `,
      params
    );
    return result.rows[0] ?? null;
  }

  async toggleFeatured(listingId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      UPDATE listings
      SET
        is_featured = NOT is_featured,
        updated_at = NOW()
      WHERE id = $1
      RETURNING ${LISTING_COLUMNS}
      `,
      [listingId]
    );
    return result.rows[0] ?? null;
  }

  async update(
    listingId: string,
    blockerId: string | null,
    input: UpdateListingInput,
    isAdmin = false,
    executor: QueryExecutor = db
  ) {
    const current = await this.findById(listingId, executor);
    if (!current || (!isAdmin && blockerId && current.blocker_id !== blockerId)) {
      return null;
    }

    let newStatus = input.status ? input.status.toUpperCase() : current.status;
    const priceChanged = input.priceRwf !== undefined && Number(input.priceRwf) !== Number(current.price_rwf);
    const upiChanged = input.upiNumber !== undefined && input.upiNumber !== current.upi_number;
    const dealChanged = input.deal !== undefined && input.deal.toLowerCase() !== (current.deal || "sale").toLowerCase();

    if (!isAdmin && current.status === "APPROVED" && (priceChanged || upiChanged || dealChanged)) {
      newStatus = "PENDING";
    }

    const isVip = input.isVip !== undefined ? input.isVip : current.is_vip;
    let discountPercent = input.vipDiscountPercent ?? current.vip_discount_percent;
    const wasPrice = input.vipWasPriceRwf !== undefined ? input.vipWasPriceRwf : current.vip_was_price_rwf;
    const price = input.priceRwf ?? current.price_rwf;

    if (isVip && wasPrice && Number(wasPrice) > Number(price) && input.vipDiscountPercent === undefined) {
      discountPercent = Number((((Number(wasPrice) - Number(price)) / Number(wasPrice)) * 100).toFixed(2));
    }

    const deal = input.deal ? (input.deal.toLowerCase() === "rent" ? "rent" : "sale") : current.deal || "sale";
    const isFeatured = input.isFeatured !== undefined ? Boolean(input.isFeatured) : Boolean(current.is_featured);
    const isDisabled = input.isDisabled !== undefined ? Boolean(input.isDisabled) : Boolean(current.is_disabled);

    const result = await executor.query(
      `
      UPDATE listings
      SET
        blocker_id = COALESCE($1, blocker_id),
        village_id = COALESCE($2, village_id),
        title_rw = COALESCE($3, title_rw),
        title_en = COALESCE($4, title_en),
        title_fr = COALESCE($5, title_fr),
        description_rw = COALESCE($6, description_rw),
        description_en = COALESCE($7, description_en),
        description_fr = COALESCE($8, description_fr),
        price_rwf = COALESCE($9, price_rwf),
        size_value = COALESCE($10, size_value),
        size_unit = COALESCE($11, size_unit),
        upi_number = COALESCE($12, upi_number),
        type = COALESCE($13, type),
        category = COALESCE($14, category),
        sub_type = COALESCE($15, sub_type),
        condition = COALESCE($16, condition),
        deal = $17,
        rental_terms = COALESCE($18, rental_terms),
        owner_name = COALESCE($19, owner_name),
        owner_phone = COALESCE($20, owner_phone),
        is_featured = $21,
        is_disabled = $22,
        is_vip = $23,
        vip_was_price_rwf = $24,
        vip_discount_percent = $25,
        vip_reason = COALESCE($26, vip_reason),
        vip_early_access_days = COALESCE($27, vip_early_access_days),
        status = $28,
        updated_at = NOW()
      WHERE id = $29
      RETURNING ${LISTING_COLUMNS}
      `,
      [
        input.blockerId ?? null,
        input.villageId ?? null,
        input.titleRw ?? null,
        input.titleEn ?? null,
        input.titleFr ?? null,
        input.descriptionRw ?? null,
        input.descriptionEn ?? null,
        input.descriptionFr ?? null,
        input.priceRwf ?? null,
        input.sizeValue ?? null,
        input.sizeUnit ?? null,
        input.upiNumber ?? null,
        input.type ?? null,
        input.category ?? null,
        input.subType ?? null,
        input.condition ?? null,
        deal,
        input.rentalTerms ?? null,
        input.ownerName ?? null,
        input.ownerPhone ?? null,
        isFeatured,
        isDisabled,
        isVip,
        isVip ? wasPrice ?? null : null,
        isVip ? discountPercent ?? null : null,
        input.vipReason ?? null,
        input.vipEarlyAccessDays ?? null,
        newStatus,
        listingId,
      ]
    );
    return result.rows[0] ?? null;
  }

  async deleteById(listingId: string, executor: QueryExecutor = db) {
    await executor.query(
      `DELETE FROM lotto_entries WHERE contact_unlock_id IN (SELECT id FROM contact_unlocks WHERE listing_id = $1)`,
      [listingId]
    );
    await executor.query(`DELETE FROM contact_unlocks WHERE listing_id = $1`, [listingId]);
    await executor.query(`DELETE FROM listing_photos WHERE listing_id = $1`, [listingId]);
    const result = await executor.query(
      `DELETE FROM listings WHERE id = $1 RETURNING ${LISTING_COLUMNS}`,
      [listingId]
    );
    return result.rows[0] ?? null;
  }
}