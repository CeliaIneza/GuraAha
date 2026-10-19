import { Router } from "express";

import { UserRepository } from "../repositories/user.repository";
import { RefreshTokenRepository } from "../repositories/refreshtoken.repository";
import { TokenService } from "../services/token.service";
import { AdminController } from "../controllers/admin.controller";

import { validate } from "../middleware/validate";
import { createAdminSchema } from "../validators/auth.validator";
import { AdminService } from "../services/admin.service";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const router = Router();

const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const tokenService = new TokenService(userRepository, refreshTokenRepository);
const adminService = new AdminService(userRepository, tokenService);
const adminController = new AdminController(adminService);

router.post('/setup', validate(createAdminSchema), adminController.createAdmin);

// All-records endpoints (any status)
router.get('/blockers', authenticate, requireRole('ADMIN'), adminController.getAllBlockers);
router.get('/listings', authenticate, requireRole('ADMIN'), adminController.getAllListings);
router.get('/subscriptions', authenticate, requireRole('ADMIN'), adminController.getAllSubscriptions);

// History endpoints (non-pending only)
router.get('/blockers/history', authenticate, requireRole('ADMIN'), adminController.getBlockerHistory);
router.get('/listings/history', authenticate, requireRole('ADMIN'), adminController.getListingHistory);

export default router;