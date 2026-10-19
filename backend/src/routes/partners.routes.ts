import { Router } from 'express';
import { PartnersRepository } from '../repositories/partners.repository';
import { PartnersController } from '../controllers/partners.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

const partnersRepository = new PartnersRepository();
const partnersController = new PartnersController(partnersRepository);

router.get('/', partnersController.getAll);
router.get('/:id', partnersController.getById);
router.post('/', authenticate, requireRole('ADMIN'), partnersController.create);
router.patch('/:id', authenticate, requireRole('ADMIN'), partnersController.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), partnersController.remove);

export default router;
