import { Router } from 'express';
import { LocationRepository } from '../repositories/location.repository';
import { LocationService } from '../services/location.service';
import { LocationController } from '../controllers/location.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const router = Router();

const locationRespository = new LocationRepository();
const locationService = new LocationService(locationRespository);
const locationController = new LocationController(locationService);

router.get('/provinces', locationController.getProvinces);
router.get('/area-highlights', locationController.getAreaHighlights);
router.put('/area-highlights/:districtName', authenticate, requireRole('ADMIN'), locationController.upsertAreaHighlight);
router.post('/districts', authenticate, requireRole('ADMIN'), locationController.addDistrict);
router.get('/:id/children', locationController.getChildren);
 
export default router;