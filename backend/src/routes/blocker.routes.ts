import { Router } from 'express';

import { BlockerRepository } from '../repositories/blocker.repository';
import { UserRepository } from '../repositories/user.repository';
import { BlockerService } from '../services/blocker.service';
import { BlockerController } from '../controllers/blocker.controller';

import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';

import {
    applyForBlockerSchema,
    rejectBlockerSchema,
} from '../validators/blocker.validator';

const router = Router();

const blockerRepository = new BlockerRepository();
const userRepository = new UserRepository();
const blockerService = new BlockerService(
    blockerRepository,
    userRepository
);
const blockerController = new BlockerController(blockerService);

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

router.patch(
    '/applications/:id/revise',
    authenticate,
    requireRole('ADMIN'),
    blockerController.revise
);

export default router;