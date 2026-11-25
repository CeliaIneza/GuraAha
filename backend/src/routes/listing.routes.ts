import { Router, Request, Response, NextFunction } from 'express';

import { ListingRepository } from '../repositories/listing.repository';
import { ListingPhotoRepository } from '../repositories/listingphoto.repository';
import { BlockerRepository } from '../repositories/blocker.repository';
import { LocationRepository } from '../repositories/location.repository';
import { ListingService } from '../services/listing.service';
import { ListingController } from '../controllers/listing.controller';

import { authenticate, optionalAuthenticate } from '../middleware/authenticate';
import { requireRole, requireFreshRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';

import {
    createListingSchema,
    updateListingSchema,
    rejectListingSchema,
    addListingPhotoSchema,
} from '../validators/listing.validator';
import {
    createImageUploader,
    handleUploadErrors,
} from '../middleware/upload';

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

// PUBLIC / OPTIONAL AUTH
router.get('/', optionalAuthenticate, listingController.getApproved);
router.get('/vip-deals', optionalAuthenticate, listingController.getVipDeals);
router.get('/vip/deals', optionalAuthenticate, listingController.getVipDeals);

// BLOCKER OR ADMIN
router.post(
    '/',
    authenticate,
    requireRole('BLOCKER', 'ADMIN'),
    validate(createListingSchema),
    listingController.create
);

router.get(
    '/me/mine',
    authenticate,
    requireRole('BLOCKER', 'ADMIN'),
    listingController.getMine
);

// ADMIN (placed before /:id so /admin/* does not match /:id)
router.get(
    '/admin/pending',
    authenticate,
    requireRole('ADMIN'),
    listingController.getPending
);

router.get(
    '/admin/pending-vip',
    authenticate,
    requireRole('ADMIN'),
    listingController.getPendingVip
);

router.post(
    '/:id/photos',
    authenticate,
    requireRole('BLOCKER', 'ADMIN'),
    handleUploadErrors(listingPhotoUploader.single('photo')),
    (req: Request, _res: Response, next: NextFunction) => {
        if (req.file) {
            const relativePath = `listings/${req.file.filename}`;
            req.body.filePath = relativePath;
        }
        if (req.body.sortOrder !== undefined) {
            req.body.sortOrder = Number(req.body.sortOrder);
        }
        next();
    },
    validate(addListingPhotoSchema),
    listingController.addPhoto
);

router.delete(
    '/photos/:photoId',
    authenticate,
    requireRole('BLOCKER', 'ADMIN'),
    listingController.removePhoto
);

router.get('/:id/photos', listingController.getPhotos);
router.get('/:id', optionalAuthenticate, listingController.getById);

router.patch(
    '/:id',
    authenticate,
    requireRole('BLOCKER', 'ADMIN'),
    validate(updateListingSchema),
    listingController.update
);

router.patch(
    '/:id/toggle-disabled',
    authenticate,
    requireRole('BLOCKER', 'ADMIN'),
    listingController.toggleDisabled
);

router.patch(
    '/:id/toggle-featured',
    authenticate,
    requireRole('ADMIN'),
    listingController.toggleFeatured
);

router.patch(
    '/:id/approve',
    authenticate,
    requireFreshRole('ADMIN'),
    listingController.approve
);

router.patch(
    '/:id/approve-vip',
    authenticate,
    requireFreshRole('ADMIN'),
    listingController.approveVip
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
    requireFreshRole('ADMIN'),
    listingController.revise
);

router.delete(
    '/:id',
    authenticate,
    requireRole('BLOCKER', 'ADMIN'),
    listingController.delete
);

export default router;