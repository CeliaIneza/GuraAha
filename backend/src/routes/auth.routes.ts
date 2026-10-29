import { Router } from "express";

import { UserRepository } from "../repositories/user.repository";
import { RefreshTokenRepository } from "../repositories/refreshtoken.repository";
import { TokenService } from "../services/token.service";
import { AuthService } from "../services/auth.service";
import { AuthController } from "../controllers/auth.controller";
import { VerificationService } from "../services/verification.service";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyCodeSchema,
} from "../validators/auth.validator";

const router = Router();

const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const tokenService = new TokenService(userRepository, refreshTokenRepository);
const authService = new AuthService(userRepository, tokenService);
const verificationService = new VerificationService(undefined, userRepository);
const authController = new AuthController(authService, tokenService, verificationService);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);

router.post('/verification/send', authenticate, authController.sendVerification);
router.post('/verification/verify', authenticate, validate(verifyCodeSchema), authController.verifyAccount);

export default router;