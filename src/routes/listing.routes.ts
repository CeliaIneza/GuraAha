import { Router } from 'express';

import { ListingRepository } from '../repositories/listing.repository.js';
import { ListingPhotoRepository } from '../repositories/listingphoto.repository.js';
import { BlockerRepository } from '../repositories/blocker.repository.js';
import { LocationRepository } from '../repositories/location.repository.js';
import { ListingService } from '../services/listing.service.js';
import { ListingController } from '../controllers/listing.controller.js';

import { authenticate } from '../middleware/authenticate.js';
import { requireRole, requireFreshRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

import {
    createListingSchema,
    rejectListingSchema,
    addListingPhotoSchema,
} from '../validators/listing.validator.js';

const router = Router();

const listingRepository = new ListingRepository();
const listingPhotoRepository = new ListingPhotoRepository();
const blockerRepository = new BlockerRepository();
const locationRepository = new LocationRepository();

const listingService = new ListingService(
    listingRepository,
    listingPhotoRepository,
    blockerRepository,
    locationRepository
);

const listingController = new ListingController(listingService);

// PUBLIC
router.get('/', listingController.getApproved);
router.get('/:id/photos', listingController.getPhotos);
router.get('/:id', listingController.getById);

// BLOCKER
router.post(
    '/',
    authenticate,
    requireRole('BLOCKER'),
    validate(createListingSchema),
    listingController.create
);

router.get(
    '/me/mine',
    authenticate,
    requireRole('BLOCKER'),
    listingController.getMine
);

router.post(
    '/:id/photos',
    authenticate,
    requireRole('BLOCKER'),
    validate(addListingPhotoSchema),
    listingController.addPhoto
);

router.delete(
    '/photos/:photoId',
    authenticate,
    requireRole('BLOCKER'),
    listingController.removePhoto
);

// ADMIN
router.get(
    '/admin/pending',
    authenticate,
    requireRole('ADMIN'),
    listingController.getPending
);

router.patch(
    '/:id/approve',
    authenticate,
    requireFreshRole('ADMIN'),
    listingController.approve
);

router.patch(
    '/:id/reject',
    authenticate,
    requireFreshRole('ADMIN'),
    validate(rejectListingSchema),
    listingController.reject
);

export default router;