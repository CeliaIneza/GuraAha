import { Router } from 'express';

import { ListingRepository } from '../repositories/listing.repository';
import { ListingPhotoRepository } from '../repositories/listingphoto.repository';
import { BlockerRepository } from '../repositories/blocker.repository';
import { LocationRepository } from '../repositories/location.repository';
import { ListingService } from '../services/listing.service';
import { ListingController } from '../controllers/listing.controller';

import { authenticate, authenticateOptional } from '../middleware/authenticate';
import { requireRole, requireFreshRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription';

import {
    createListingSchema,
    rejectListingSchema,
} from '../validators/listing.validator';
import { createImageUploader, handleUploadErrors } from '../middleware/upload';

const router = Router();

const listingRepository = new ListingRepository();
const listingPhotoRepository = new ListingPhotoRepository();
const blockerRepository = new BlockerRepository();
const locationRepository = new LocationRepository();

const listingPhotoUploader = createImageUploader('listings');

const listingService = new ListingService(
    listingRepository,
    listingPhotoRepository,
    blockerRepository,
    locationRepository
);

const listingController = new ListingController(listingService);

router.get('/', listingController.getApproved);

router.get(
    '/me/mine',
    authenticate,
    requireRole('BLOCKER'),
    listingController.getMine
);

router.get(
    '/admin/pending',
    authenticate,
    requireRole('ADMIN'),
    listingController.getPending
);

router.post(
    '/',
    authenticate,
    requireActiveSubscription,
    requireRole('BLOCKER'),
    validate(createListingSchema),
    listingController.create
);

router.get('/:id/photos', listingController.getPhotos);
router.get('/:id', authenticateOptional, listingController.getById);

router.post(
    '/:id/photos',
    authenticate,
    requireRole('BLOCKER'),
    handleUploadErrors(listingPhotoUploader.single('photo')),
    listingController.addPhoto
);

router.delete(
    '/photos/:photoId',
    authenticate,
    requireRole('BLOCKER'),
    listingController.removePhoto
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

router.patch(
    '/:id/revise',
    authenticate,
    requireRole('ADMIN'),
    listingController.revise
);

export default router;
