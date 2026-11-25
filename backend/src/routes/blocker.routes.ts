import { Router } from 'express';

import { BlockerRepository } from '../repositories/blocker.repository';
import { UserRepository } from '../repositories/user.repository';
import { BlockerService } from '../services/blocker.service';
import { BlockerController } from '../controllers/blocker.controller';

import { authenticate, optionalAuthenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';

import {
    applyForBlockerSchema,
    rejectBlockerSchema,
} from '../validators/blocker.validator';

const router = Router();

const blockerRepository = new BlockerRepository();
const userRepository = new UserRepository();
const blockerService = new BlockerService(blockerRepository, userRepository);
const blockerController = new BlockerController(blockerService);

// PUBLIC OR AUTHENTICATED USER (prototype Become a Blocker works for any visitor or user)
router.post(
    '/apply',
    optionalAuthenticate,
    validate(applyForBlockerSchema),
    blockerController.apply
);

router.get(
    '/application/me',
    authenticate,
    requireRole('USER', 'BLOCKER', 'ADMIN'),
    blockerController.getMyApplication
);

// ADMIN
router.get(
    '/applications',
    authenticate,
    requireRole('ADMIN'),
    blockerController.getPendingApplications
);

router.post(
    '/admin/save',
    authenticate,
    requireRole('ADMIN'),
    blockerController.adminSave
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
    '/applications/:id/suspend',
    authenticate,
    requireRole('ADMIN'),
    blockerController.suspend
);

router.post(
    '/applications/:id/reset-password',
    authenticate,
    requireRole('ADMIN'),
    blockerController.resetPassword
);

router.patch(
    '/applications/:id/revise',
    authenticate,
    requireRole('ADMIN'),
    blockerController.revise
);

router.delete(
    '/applications/:id',
    authenticate,
    requireRole('ADMIN'),
    blockerController.delete
);

export default router;