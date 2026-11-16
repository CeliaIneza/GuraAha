import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface CreateListingInput {
  blockerId: string;
  villageId: string;
  type: string;
  category?: string;
  subType?: string;
  condition?: string;
  titleRw?: string;
  titleEn?: string;
  titleFr?: string;
  descriptionRw?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  priceRwf: number;
  sizeValue: number;
  sizeUnit: string;
  upiNumber?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownershipDocumentPath?: string;
  isVip?: boolean;
  vipWasPriceRwf?: number;
  vipDiscountPercent?: number;
  vipReason?: string;
  vipEarlyAccessDays?: number;
}

export interface UpdateListingInput {
  titleRw?: string;
  titleEn?: string;
  titleFr?: string;
  descriptionRw?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  priceRwf?: number;
  sizeValue?: number;
  sizeUnit?: string;
  upiNumber?: string;
  type?: string;
  category?: string;
  subType?: string;
  condition?: string;
  isVip?: boolean;
  vipWasPriceRwf?: number;
  vipDiscountPercent?: number;
  vipReason?: string;
}

export interface ListingFilters {
  villageId?: string;
  districtId?: string;
  province?: string;
  district?: string;
  type?: string;
  category?: string;
  subType?: string;
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

export class ListingRepository {
  async create(input: CreateListingInput, executor: QueryExecutor = db) {
    const isVip = Boolean(input.isVip);
    let discountPercent = input.vipDiscountPercent ?? null;
    if (isVip && input.vipWasPriceRwf && input.vipWasPriceRwf > input.priceRwf && !discountPercent) {
      discountPercent = Number((((input.vipWasPriceRwf - input.priceRwf) / input.vipWasPriceRwf) * 100).toFixed(2));
    }

    const result = await executor.query(
      `
      INSERT INTO listings (
        blocker_id, village_id, type, category, sub_type, condition,
        title_rw, title_en, title_fr,
        description_rw, description_en, description_fr,
        price_rwf, size_value, size_unit,
        upi_number, owner_name, owner_phone, ownership_document_path,
        is_vip, vip_was_price_rwf, vip_discount_percent, vip_reason, vip_early_access_days
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23, $24
      )
      RETURNING ${LISTING_COLUMNS}
      `,
      [
        input.blockerId,
        input.villageId,
        input.type,
        input.category ?? null,
        input.subType ?? null,
        input.condition ?? null,
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
        isVip,
        input.vipWasPriceRwf ?? null,
        discountPercent,
        input.vipReason ?? null,
        input.vipEarlyAccessDays ?? 7,
      ]
    );
    return result.rows[0];
  }

  async findById(id: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `SELECT ${LISTING_COLUMNS} FROM listings WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByIdWithOwner(id: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT
        l.id,
        l.blocker_id,
        l.village_id,
        l.type,
        l.category,
        l.sub_type,
        l.condition,
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
        bp.user_id AS owner_user_id
      FROM listings l
      INNER JOIN blocker_profiles bp ON bp.id = l.blocker_id
      WHERE l.id = $1
      `,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByBlockerId(blockerId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${LISTING_COLUMNS}
      FROM listings
      WHERE blocker_id = $1
      ORDER BY created_at DESC
      `,
      [blockerId]
    );
    return result.rows;
  }

  async findPending(executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${LISTING_COLUMNS}
      FROM listings
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
      `
    );
    return result.rows;
  }

  async findPendingVip(executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${LISTING_COLUMNS}
      FROM listings
      WHERE status = 'PENDING' AND is_vip = TRUE
      ORDER BY created_at ASC
      `
    );
    return result.rows;
  }

  async findApproved(filters: ListingFilters, isVipUser: boolean = false, executor: QueryExecutor = db) {
    const conditions: string[] = [`status = 'APPROVED'`, `is_disabled = FALSE`];
    const values: unknown[] = [];

    // VIP Visibility Rule
    if (!isVipUser) {
      conditions.push(`(is_vip = FALSE OR vip_expires_at IS NULL OR vip_expires_at <= NOW())`);
    }

    if (filters.villageId) {
      values.push(filters.villageId);
      conditions.push(`village_id = $${values.length}`);
    }

    if (filters.type) {
      values.push(filters.type);
      conditions.push(`type = $${values.length}`);
    }

    if (filters.category) {
      values.push(filters.category);
      conditions.push(`category = $${values.length}`);
    }

    if (filters.subType) {
      values.push(filters.subType);
      conditions.push(`sub_type = $${values.length}`);
    }

    if (filters.maxPrice) {
      values.push(filters.maxPrice);
      conditions.push(`price_rwf <= $${values.length}`);
    }

    if (filters.minPrice) {
      values.push(filters.minPrice);
      conditions.push(`price_rwf >= $${values.length}`);
    }

    values.push(filters.limit);
    const limitParam = `$${values.length}`;
    values.push(filters.offset);
    const offsetParam = `$${values.length}`;

    const result = await executor.query(
      `
      SELECT ${LISTING_COLUMNS}
      FROM listings
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
      `,
      values
    );
    return result.rows;
  }

  async findVipDeals(filters: { limit: number; offset: number }, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${LISTING_COLUMNS}
      FROM listings
      WHERE is_vip = TRUE
        AND status = 'APPROVED'
        AND is_disabled = FALSE
        AND (vip_expires_at IS NULL OR vip_expires_at > NOW())
      ORDER BY created_at DESC
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
        reviewed_by = $1,
        reviewed_at = NOW(),
        approved_at = NOW(),
        rejection_reason = NULL,
        updated_at = NOW()
      WHERE id = $2
        AND status = 'PENDING'
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
        is_vip = TRUE,
        vip_early_access_days = $1,
        vip_expires_at = NOW() + ($1 || ' days')::interval,
        reviewed_by = $2,
        reviewed_at = NOW(),
        approved_at = NOW(),
        rejection_reason = NULL,
        updated_at = NOW()
      WHERE id = $3
        AND status = 'PENDING'
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
        AND status = 'PENDING'
      RETURNING ${LISTING_COLUMNS}
      `,
      [rejectionReason, reviewedBy, listingId]
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
      WHERE ${conditions.join(' AND ')}
      RETURNING ${LISTING_COLUMNS}
      `,
      params
    );
    return result.rows[0] ?? null;
  }

  async update(listingId: string, blockerId: string, input: UpdateListingInput, executor: QueryExecutor = db) {
    const current = await this.findById(listingId, executor);
    if (!current || current.blocker_id !== blockerId) {
      return null;
    }

    // Price or UPI changes require re-approval if the listing was APPROVED
    let newStatus = current.status;
    const priceChanged = input.priceRwf !== undefined && input.priceRwf !== current.price_rwf;
    const upiChanged = input.upiNumber !== undefined && input.upiNumber !== current.upi_number;

    if (current.status === 'APPROVED' && (priceChanged || upiChanged)) {
      newStatus = 'PENDING';
    }

    const isVip = input.isVip !== undefined ? input.isVip : current.is_vip;
    let discountPercent = input.vipDiscountPercent ?? current.vip_discount_percent;
    const wasPrice = input.vipWasPriceRwf ?? current.vip_was_price_rwf;
    const price = input.priceRwf ?? current.price_rwf;

    if (isVip && wasPrice && wasPrice > price && input.vipDiscountPercent === undefined) {
      discountPercent = Number((((wasPrice - price) / wasPrice) * 100).toFixed(2));
    }

    const result = await executor.query(
      `
      UPDATE listings
      SET
        title_rw = COALESCE($1, title_rw),
        title_en = COALESCE($2, title_en),
        title_fr = COALESCE($3, title_fr),
        description_rw = COALESCE($4, description_rw),
        description_en = COALESCE($5, description_en),
        description_fr = COALESCE($6, description_fr),
        price_rwf = COALESCE($7, price_rwf),
        size_value = COALESCE($8, size_value),
        size_unit = COALESCE($9, size_unit),
        upi_number = COALESCE($10, upi_number),
        type = COALESCE($11, type),
        category = COALESCE($12, category),
        sub_type = COALESCE($13, sub_type),
        condition = COALESCE($14, condition),
        is_vip = $15,
        vip_was_price_rwf = $16,
        vip_discount_percent = $17,
        vip_reason = COALESCE($18, vip_reason),
        status = $19,
        updated_at = NOW()
      WHERE id = $20 AND blocker_id = $21
      RETURNING ${LISTING_COLUMNS}
      `,
      [
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
        isVip,
        wasPrice ?? null,
        discountPercent ?? null,
        input.vipReason ?? null,
        newStatus,
        listingId,
        blockerId,
      ]
    );
    return result.rows[0] ?? null;
  }
}