import { Request, Response } from 'express';
import { CategoryRepository } from '../repositories/category.repository';
import { db } from '../config/database';

export class CategoryController {
  constructor(private readonly categoryRepository = new CategoryRepository()) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await this.categoryRepository.findAll(includeInactive);
      return res.status(200).json({ data: categories });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to fetch categories',
      });
    }
  };

  createCategory = async (req: Request, res: Response) => {
    try {
      const { nameEn, nameRw, nameFr, badgeClass, sortOrder, isActive, subtypes } = req.body || {};
      if (!nameEn || !String(nameEn).trim()) {
        return res.status(400).json({ message: 'Category English name is required' });
      }
      const category = await this.categoryRepository.createCategory({
        nameEn,
        nameRw,
        nameFr,
        badgeClass,
        sortOrder,
        isActive,
      });

      if (Array.isArray(subtypes)) {
        for (const st of subtypes) {
          const stName = typeof st === 'string' ? st : st?.nameEn;
          if (stName && String(stName).trim()) {
            await this.categoryRepository.createSubtype(category.id, {
              nameEn: String(stName).trim(),
              nameRw: st?.nameRw,
              nameFr: st?.nameFr,
            });
          }
        }
      }

      await db.query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
        req.user?.id ?? null,
        `➕ Category "${category.name_en}" created/updated`,
      ]).catch(() => {});

      const all = await this.categoryRepository.findAll(true);
      return res.status(201).json({ message: 'Category saved', data: category, categories: all });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to create category',
      });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const updated = await this.categoryRepository.updateCategory(String(req.params.id), req.body || {});
      if (!updated) {
        return res.status(404).json({ message: 'Category not found' });
      }
      await db.query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
        req.user?.id ?? null,
        `💾 Category "${updated.name_en}" updated`,
      ]).catch(() => {});
      return res.status(200).json({ message: 'Category updated', data: updated });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to update category',
      });
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      const deleted = await this.categoryRepository.deleteCategory(String(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: 'Category not found' });
      }
      await db.query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
        req.user?.id ?? null,
        `🗑 Category "${deleted.name_en}" deleted`,
      ]).catch(() => {});
      return res.status(200).json({ message: 'Category deleted', data: deleted });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to delete category',
      });
    }
  };

  createSubtype = async (req: Request, res: Response) => {
    try {
      const { nameEn, nameRw, nameFr, sortOrder, isActive } = req.body || {};
      if (!nameEn || !String(nameEn).trim()) {
        return res.status(400).json({ message: 'Sub-type English name is required' });
      }
      const subtype = await this.categoryRepository.createSubtype(String(req.params.categoryId), {
        nameEn,
        nameRw,
        nameFr,
        sortOrder,
        isActive,
      });
      await db.query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
        req.user?.id ?? null,
        `➕ Sub-type "${subtype.name_en}" added`,
      ]).catch(() => {});
      return res.status(201).json({ message: 'Sub-type added', data: subtype });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to add sub-type',
      });
    }
  };

  updateSubtype = async (req: Request, res: Response) => {
    try {
      const updated = await this.categoryRepository.updateSubtype(String(req.params.subtypeId), req.body || {});
      if (!updated) {
        return res.status(404).json({ message: 'Sub-type not found' });
      }
      await db.query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
        req.user?.id ?? null,
        `💾 Sub-type "${updated.name_en}" updated`,
      ]).catch(() => {});
      return res.status(200).json({ message: 'Sub-type updated', data: updated });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to update sub-type',
      });
    }
  };

  deleteSubtype = async (req: Request, res: Response) => {
    try {
      const deleted = await this.categoryRepository.deleteSubtype(String(req.params.subtypeId));
      if (!deleted) {
        return res.status(404).json({ message: 'Sub-type not found' });
      }
      await db.query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
        req.user?.id ?? null,
        `🗑 Sub-type "${deleted.name_en}" deleted`,
      ]).catch(() => {});
      return res.status(200).json({ message: 'Sub-type deleted', data: deleted });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to delete sub-type',
      });
    }
  };
}
