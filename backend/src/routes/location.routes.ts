import { Router } from 'express';
import { LocationRepository } from '../repositories/location.repository';
import { LocationService } from '../services/location.service';
import { LocationController } from '../controllers/location.controller';

const router = Router();

const locationRespository = new LocationRepository();
const locationService = new LocationService(locationRespository);
const locationController = new LocationController(locationService);

router.get('/provinces', locationController.getProvinces);
router.get('/:id/children', locationController.getChildren);
 
export default router;