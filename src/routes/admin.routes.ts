import { Router } from "express";

import { UserRepository } from "../repositories/user.repository";
import { RefreshTokenRepository } from "../repositories/refreshtoken.repository";
import { TokenService } from "../services/token.service";
import { AdminController } from "../controllers/admin.controller";

import { validate } from "../middleware/validate";
import { createAdminSchema } from "../validators/auth.validator";
import { AdminService } from "../services/admin.service";

const router = Router();

const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const tokenService = new TokenService(userRepository, refreshTokenRepository);
const adminService = new AdminService(userRepository, tokenService);
const adminController = new AdminController(adminService);



// Locked down via ADMIN_SETUP_SECRET (x-admin-setup-secret header), not
// requireRole — there's no admin yet to gate the first one, and the
// decision was to keep this secret-gated permanently rather than switch to
// role-gating after bootstrap.

router.post('/setup', validate(createAdminSchema), adminController.createAdmin);

export default router;