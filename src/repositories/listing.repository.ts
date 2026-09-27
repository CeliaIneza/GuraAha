import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface CreateListingInput {
  blockerId: string;
  villageId: string;
  type: string;
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
}


export interface ListingFilters {
    villageId?: string;
    type?: string;
    limit: string;
    offset: number;
}

const LISTING_COLUMNS = `
  id,
  blocker_id,
  village_id,
  type,
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
  rejection_reason,
  reviewed_by,
  reviewed_at,
  approved_at,
  created_at,
  updated_at
`;

export class ListingRepository {
  async create(input: CreateListingInput, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      INSERT INTO listings (
        blocker_id, village_id, type,
        title_rw, title_en, title_fr,
        description_rw, description_en, description_fr,
        price_rwf, size_value, size_unit,
        upi_number, owner_name, owner_phone, ownership_document_path
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15, $16
      )
      RETURNING ${LISTING_COLUMNS}
      `,
      [
        input.blockerId,
        input.villageId,
        input.type,
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
 
  async findApproved(filters: ListingFilters, executor: QueryExecutor = db) {
    const conditions: string[] = [`status = 'APPROVED'`];
    const values: unknown[] = [];
 
    if (filters.villageId) {
      values.push(filters.villageId);
      conditions.push(`village_id = $${values.length}`);
    }
 
    if (filters.type) {
      values.push(filters.type);
      conditions.push(`type = $${values.length}`);
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
}