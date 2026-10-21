import { Router, Request, Response } from "express";

import { UserRepository } from "../repositories/user.repository";
import { RefreshTokenRepository } from "../repositories/refreshtoken.repository";
import { TokenService } from "../services/token.service";
import { AdminController } from "../controllers/admin.controller";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import { createAdminSchema } from "../validators/auth.validator";
import { AdminService } from "../services/admin.service";
import { db } from "../config/database";

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

// ── Admin data endpoints (all roles = ADMIN) ────────────────────────────────

/**
 * GET /admin/blockers — all blocker applications with any status
 */
router.get('/blockers', authenticate, requireRole('ADMIN'), async (_req: Request, res: Response) => {
    try {
        const result = await db.query(`
            SELECT
                bp.id,
                bp.user_id,
                bp.national_id,
                bp.operating_location_id,
                bp.verification_code,
                bp.status,
                bp.rejection_reason,
                bp.reviewed_by,
                bp.reviewed_at,
                bp.approved_at,
                bp.created_at,
                bp.updated_at,
                u.phone,
                u.email,
                u.first_name,
                u.last_name,
                loc.name AS operating_location_name
            FROM blocker_profiles bp
            INNER JOIN users u ON u.id = bp.user_id
            LEFT JOIN locations loc ON loc.id = bp.operating_location_id
            ORDER BY bp.created_at DESC
        `);
        return res.status(200).json({ data: result.rows });
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : 'Failed to retrieve blockers'
        });
    }
});

/**
 * GET /admin/listings — all listings with any status, with blocker info
 */
router.get('/listings', authenticate, requireRole('ADMIN'), async (_req: Request, res: Response) => {
    try {
        const result = await db.query(`
            SELECT
                l.id,
                l.blocker_id,
                l.village_id,
                l.type,
                COALESCE(l.title_en, l.title_rw, l.title_fr) AS title,
                l.title_en,
                l.title_rw,
                l.title_fr,
                l.price_rwf,
                l.size_value,
                l.size_unit,
                l.upi_number,
                l.owner_name,
                l.owner_phone,
                l.status,
                l.rejection_reason,
                l.reviewed_by,
                l.reviewed_at,
                l.created_at,
                l.updated_at,
                u.first_name AS blocker_first_name,
                u.last_name AS blocker_last_name,
                u.phone AS blocker_phone
            FROM listings l
            INNER JOIN blocker_profiles bp ON bp.id = l.blocker_id
            INNER JOIN users u ON u.id = bp.user_id
            ORDER BY l.created_at DESC
        `);
        return res.status(200).json({ data: result.rows });
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : 'Failed to retrieve listings'
        });
    }
});

/**
 * GET /admin/subscriptions — all subscriptions with blocker info
 */
router.get('/subscriptions', authenticate, requireRole('ADMIN'), async (_req: Request, res: Response) => {
    try {
        const result = await db.query(`
            SELECT
                s.id,
                s.blocker_id,
                s.plan,
                s.status,
                s.starts_at,
                s.expires_at,
                s.cancelled_at,
                s.created_at,
                s.updated_at,
                u.first_name,
                u.last_name,
                u.phone
            FROM subscriptions s
            INNER JOIN blocker_profiles bp ON bp.id = s.blocker_id
            INNER JOIN users u ON u.id = bp.user_id
            ORDER BY s.created_at DESC
        `);
        return res.status(200).json({ data: result.rows });
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : 'Failed to retrieve subscriptions'
        });
    }
});

export default router;
