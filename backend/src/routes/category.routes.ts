import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();
const controller = new CategoryController();

// Public endpoint
router.get('/', controller.getAll);

// Admin management endpoints
router.post('/', authenticate, requireRole('ADMIN'), controller.createCategory);
router.patch('/:id', authenticate, requireRole('ADMIN'), controller.updateCategory);
router.delete('/:id', authenticate, requireRole('ADMIN'), controller.deleteCategory);

router.post('/:categoryId/subtypes', authenticate, requireRole('ADMIN'), controller.createSubtype);
router.patch('/subtypes/:subtypeId', authenticate, requireRole('ADMIN'), controller.updateSubtype);
router.delete('/subtypes/:subtypeId', authenticate, requireRole('ADMIN'), controller.deleteSubtype);

export default router;
