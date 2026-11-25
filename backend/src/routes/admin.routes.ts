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
router.get('/blockers/history', authenticate, requireRole('ADMIN'), adminController.getBlockerHistory);
router.get('/listings', authenticate, requireRole('ADMIN'), adminController.getListings);
router.get('/listings/history', authenticate, requireRole('ADMIN'), adminController.getListingHistory);
router.get('/subscriptions', authenticate, requireRole('ADMIN'), adminController.getSubscriptions);
router.post('/subscriptions/save', authenticate, requireRole('ADMIN'), adminController.saveSubscriber);
router.patch('/subscriptions/:id/extend', authenticate, requireRole('ADMIN'), adminController.extendSubscription);
router.patch('/subscriptions/:id/toggle-cancel', authenticate, requireRole('ADMIN'), adminController.toggleCancelSubscription);
router.delete('/subscriptions/:id', authenticate, requireRole('ADMIN'), adminController.deleteSubscription);

router.post('/vip-promotions', authenticate, requireRole('ADMIN'), adminController.saveVipPromotion);
router.post('/vip-promotions/:id/end', authenticate, requireRole('ADMIN'), adminController.endVipPromotion);
router.post('/vip-promotions/:id/alert', authenticate, requireRole('ADMIN'), adminController.sendVipAlert);

router.get('/payments', authenticate, requireRole('ADMIN'), adminController.getPayments);
router.post('/payments/:id/refund', authenticate, requireRole('ADMIN'), adminController.refundPayment);
router.post('/payments/:id/recheck', authenticate, requireRole('ADMIN'), adminController.recheckPayment);

router.get('/audit-logs', authenticate, requireRole('ADMIN'), adminController.getAuditLogs);

export default router;
