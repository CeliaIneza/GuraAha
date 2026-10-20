import { Router } from "express";

import { UserRepository } from "../repositories/user.repository";
import { RefreshTokenRepository } from "../repositories/refreshtoken.repository";
import { TokenService } from "../services/token.service";
import { AuthService } from "../services/auth.service";
import { AuthController } from "../controllers/auth.controller";

import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, refreshTokenSchema } from "../validators/auth.validator";

const router = Router();

const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const tokenService = new TokenService(userRepository, refreshTokenRepository);
const authService = new AuthService(userRepository, tokenService);
const authController = new AuthController(authService, tokenService);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);

export default router;