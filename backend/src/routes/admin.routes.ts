import { Router } from "express";

import { UserRepository } from "../repositories/user.repository";
import { RefreshTokenRepository } from "../repositories/refreshtoken.repository";
import { AdminRepository } from "../repositories/admin.repository";
import { TokenService } from "../services/token.service";
import { AdminController } from "../controllers/admin.controller";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import { createAdminSchema } from "../validators/auth.validator";
import { AdminService } from "../services/admin.service";

const router = Router();

const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const adminRepository = new AdminRepository();
const tokenService = new TokenService(userRepository, refreshTokenRepository);
const adminService = new AdminService(userRepository, tokenService, adminRepository);
const adminController = new AdminController(adminService);

router.post('/setup', validate(createAdminSchema), adminController.createAdmin);

router.get('/blockers', authenticate, requireRole('ADMIN'), adminController.getBlockers);
router.get('/listings', authenticate, requireRole('ADMIN'), adminController.getListings);
router.get('/subscriptions', authenticate, requireRole('ADMIN'), adminController.getSubscriptions);

export default router;
