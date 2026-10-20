import { Router } from 'express';

import { BlockerRepository } from '../repositories/blocker.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { BlockerService } from '../services/blocker.service.js';
import { BlockerController } from '../controllers/blocker.controller.js';

import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';

import {
    applyForBlockerSchema,
    rejectBlockerSchema,
} from '../validators/blocker.validator.js';

const router = Router();

const blockerRepository =
    new BlockerRepository();

const userRepository =
    new UserRepository();

const blockerService =
    new BlockerService(
        blockerRepository,
        userRepository
    );

const blockerController =
    new BlockerController(
        blockerService
    );

// USER
router.post(
    '/apply',
    authenticate,
    requireRole('USER'),
    validate(applyForBlockerSchema),
    blockerController.apply
);

router.get(
    '/application/me',
    authenticate,
    requireRole('USER', 'BLOCKER'),
    blockerController.getMyApplication
);

// ADMIN
router.get(
    '/applications',
    authenticate,
    requireRole('ADMIN'),
    blockerController.getPendingApplications
);

router.patch(
    '/applications/:id/approve',
    authenticate,
    requireRole('ADMIN'),
    blockerController.approve
);

router.patch(
    '/applications/:id/reject',
    authenticate,
    requireRole('ADMIN'),
    validate(rejectBlockerSchema),
    blockerController.reject
);

export default router;