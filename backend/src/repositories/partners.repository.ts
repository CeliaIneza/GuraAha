import { db } from '../config/database';

type QueryExecutor = { query: typeof db.query };

export interface CreatePartnerInput {
  type: string;
  name: string;
  phone?: string;
  email?: string;
  locationId?: string;
  descriptionRw?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  isCertified?: boolean;
}

export interface PartnerFilters {
  type?: string;
  locationId?: string;
  isActive?: boolean;
}

export interface PartnerRow {
  id: string;
  type: string;
  name: string;
  phone: string | null;
  email: string | null;
  location_id: string | null;
  description_rw: string | null;
  description_en: string | null;
  description_fr: string | null;
  is_certified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  location_name: string | null;
}

const PARTNER_SELECT = `
  p.id,
  p.type,
  p.name,
  p.phone,
  p.email,
  p.location_id,
  p.description_rw,
  p.description_en,
  p.description_fr,
  p.is_certified,
  p.is_active,
  p.created_at,
  p.updated_at,
  loc.name AS location_name
`;

const PARTNER_JOINS = `
  FROM partners p
  LEFT JOIN locations loc ON loc.id = p.location_id
`;

export class PartnersRepository {
  async findAll(
    filters?: PartnerFilters,
    executor: QueryExecutor = db
  ): Promise<PartnerRow[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters?.type) {
      values.push(filters.type);
      conditions.push(`p.type = $${values.length}`);
    }

    if (filters?.locationId) {
      values.push(filters.locationId);
      conditions.push(`p.location_id = $${values.length}`);
    }

    if (filters?.isActive !== undefined) {
      values.push(filters.isActive);
      conditions.push(`p.is_active = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await executor.query(
      `
      SELECT ${PARTNER_SELECT}
      ${PARTNER_JOINS}
      ${whereClause}
      ORDER BY p.is_certified DESC, p.created_at DESC
      `,
      values
    );

    return result.rows;
  }

  async findById(
    id: string,
    executor: QueryExecutor = db
  ): Promise<PartnerRow | null> {
    const result = await executor.query(
      `
      SELECT ${PARTNER_SELECT}
      ${PARTNER_JOINS}
      WHERE p.id = $1
      `,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async create(
    input: CreatePartnerInput,
    executor: QueryExecutor = db
  ): Promise<PartnerRow> {
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
        is_active,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
      RETURNING id
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
      ]
    );

    const partnerId = result.rows[0]!.id;
    const partner = await this.findById(partnerId, executor);
    return partner!;
  }

  async update(
    id: string,
    input: Partial<CreatePartnerInput>,
    executor: QueryExecutor = db
  ): Promise<PartnerRow | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (input.type !== undefined) {
      values.push(input.type);
      setClauses.push(`type = $${values.length}`);
    }
    if (input.name !== undefined) {
      values.push(input.name);
      setClauses.push(`name = $${values.length}`);
    }
    if (input.phone !== undefined) {
      values.push(input.phone);
      setClauses.push(`phone = $${values.length}`);
    }
    if (input.email !== undefined) {
      values.push(input.email);
      setClauses.push(`email = $${values.length}`);
    }
    if (input.locationId !== undefined) {
      values.push(input.locationId);
      setClauses.push(`location_id = $${values.length}`);
    }
    if (input.descriptionRw !== undefined) {
      values.push(input.descriptionRw);
      setClauses.push(`description_rw = $${values.length}`);
    }
    if (input.descriptionEn !== undefined) {
      values.push(input.descriptionEn);
      setClauses.push(`description_en = $${values.length}`);
    }
    if (input.descriptionFr !== undefined) {
      values.push(input.descriptionFr);
      setClauses.push(`description_fr = $${values.length}`);
    }
    if (input.isCertified !== undefined) {
      values.push(input.isCertified);
      setClauses.push(`is_certified = $${values.length}`);
    }

    if (setClauses.length === 0) {
      return this.findById(id, executor);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await executor.query(
      `
      UPDATE partners
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length}
      RETURNING id
      `,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.findById(id, executor);
  }

  async delete(
    id: string,
    executor: QueryExecutor = db
  ): Promise<PartnerRow | null> {
    const result = await executor.query(
      `
      UPDATE partners
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.findById(id, executor);
  }
}
