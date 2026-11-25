import { db } from '../config/database';

export class CategoryRepository {
  async findAll(includeInactive = false) {
    const catWhere = includeInactive ? '' : 'WHERE c.is_active = TRUE';
    const subWhere = includeInactive ? '' : 'AND s.is_active = TRUE';

    const result = await db.query(
      `
      SELECT
        c.id,
        c.slug,
        c.name_en,
        c.name_rw,
        c.name_fr,
        c.badge_class,
        c.sort_order,
        c.is_active,
        c.created_at,
        c.updated_at,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', s.id,
                'category_id', s.category_id,
                'slug', s.slug,
                'name_en', s.name_en,
                'name_rw', s.name_rw,
                'name_fr', s.name_fr,
                'sort_order', s.sort_order,
                'is_active', s.is_active
              )
              ORDER BY s.sort_order ASC, s.name_en ASC
            )
            FROM property_subtypes s
            WHERE s.category_id = c.id ${subWhere}
          ),
          '[]'::jsonb
        ) AS subtypes
      FROM property_categories c
      ${catWhere}
      ORDER BY c.sort_order ASC, c.name_en ASC
      `
    );
    return result.rows;
  }

  async createCategory(input: {
    nameEn: string;
    nameRw?: string;
    nameFr?: string;
    badgeClass?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const slug = input.nameEn.trim();
    const result = await db.query(
      `
      INSERT INTO property_categories (slug, name_en, name_rw, name_fr, badge_class, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (slug) DO UPDATE
      SET
        name_en = EXCLUDED.name_en,
        name_rw = EXCLUDED.name_rw,
        name_fr = EXCLUDED.name_fr,
        badge_class = EXCLUDED.badge_class,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *
      `,
      [
        slug,
        input.nameEn.trim(),
        (input.nameRw || input.nameEn).trim(),
        (input.nameFr || input.nameEn).trim(),
        input.badgeClass || 'b-land',
        input.sortOrder ?? 10,
        input.isActive ?? true,
      ]
    );
    return result.rows[0];
  }

  async updateCategory(
    id: string,
    input: {
      nameEn?: string;
      nameRw?: string;
      nameFr?: string;
      badgeClass?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    const result = await db.query(
      `
      UPDATE property_categories
      SET
        slug = COALESCE($1, slug),
        name_en = COALESCE($1, name_en),
        name_rw = COALESCE($2, name_rw),
        name_fr = COALESCE($3, name_fr),
        badge_class = COALESCE($4, badge_class),
        sort_order = COALESCE($5, sort_order),
        is_active = COALESCE($6, is_active),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
      `,
      [
        input.nameEn?.trim() ?? null,
        input.nameRw?.trim() ?? null,
        input.nameFr?.trim() ?? null,
        input.badgeClass ?? null,
        input.sortOrder ?? null,
        input.isActive ?? null,
        id,
      ]
    );
    return result.rows[0] ?? null;
  }

  async deleteCategory(id: string) {
    const result = await db.query(
      `DELETE FROM property_categories WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async createSubtype(
    categoryId: string,
    input: {
      nameEn: string;
      nameRw?: string;
      nameFr?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    const slug = input.nameEn.trim();
    const result = await db.query(
      `
      INSERT INTO property_subtypes (category_id, slug, name_en, name_rw, name_fr, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (category_id, slug) DO UPDATE
      SET
        name_en = EXCLUDED.name_en,
        name_rw = EXCLUDED.name_rw,
        name_fr = EXCLUDED.name_fr,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *
      `,
      [
        categoryId,
        slug,
        input.nameEn.trim(),
        (input.nameRw || input.nameEn).trim(),
        (input.nameFr || input.nameEn).trim(),
        input.sortOrder ?? 10,
        input.isActive ?? true,
      ]
    );
    return result.rows[0];
  }

  async updateSubtype(
    subtypeId: string,
    input: {
      nameEn?: string;
      nameRw?: string;
      nameFr?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    const result = await db.query(
      `
      UPDATE property_subtypes
      SET
        slug = COALESCE($1, slug),
        name_en = COALESCE($1, name_en),
        name_rw = COALESCE($2, name_rw),
        name_fr = COALESCE($3, name_fr),
        sort_order = COALESCE($4, sort_order),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
      `,
      [
        input.nameEn?.trim() ?? null,
        input.nameRw?.trim() ?? null,
        input.nameFr?.trim() ?? null,
        input.sortOrder ?? null,
        input.isActive ?? null,
        subtypeId,
      ]
    );
    return result.rows[0] ?? null;
  }

  async deleteSubtype(subtypeId: string) {
    const result = await db.query(
      `DELETE FROM property_subtypes WHERE id = $1 RETURNING *`,
      [subtypeId]
    );
    return result.rows[0] ?? null;
  }
}
