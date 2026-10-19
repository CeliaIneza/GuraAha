import { Router } from 'express';
import { SettingsRepository } from '../repositories/settings.repository';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

const settingsRepository = new SettingsRepository();
const settingsController = new SettingsController(settingsRepository);

router.get('/', settingsController.getAll);
router.patch('/:key', authenticate, requireRole('ADMIN'), settingsController.update);

export default router;
