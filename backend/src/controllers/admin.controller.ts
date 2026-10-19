import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { db } from '../config/database';

export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    createAdmin = async (req: Request, res: Response) => {
        try {
            const secretHeader = req.headers['x-admin-setup-secret'];
            const providedSecret = typeof secretHeader === 'string' ? secretHeader : undefined;
            const result = await this.adminService.createAdmin(req.body, providedSecret);
            return res.status(201).json({ message: 'Admin account created', data: result });
        } catch (error) {
            return res.status(403).json({
                message: error instanceof Error ? error.message : 'Failed to create admin account',
            });
        }
    };

    /* ── ALL BLOCKERS (any status) ── */
    getAllBlockers = async (_req: Request, res: Response) => {
        try {
            const result = await db.query(
                `SELECT bp.id, bp.status, bp.national_id, bp.verification_code,
                    bp.rejection_reason, bp.admin_note, bp.contact_email,
                    bp.reviewed_at, bp.approved_at, bp.created_at,
                    u.first_name, u.last_name, u.phone, u.email,
                    l.name AS operating_location_name,
                    rv.first_name AS reviewer_first_name, rv.last_name AS reviewer_last_name
                 FROM blocker_profiles bp
                 INNER JOIN users u ON u.id = bp.user_id
                 LEFT JOIN locations l ON l.id = bp.operating_location_id
                 LEFT JOIN users rv ON rv.id = bp.reviewed_by
                 ORDER BY bp.created_at DESC`
            );
            return res.status(200).json({ data: result.rows });
        } catch (err) {
            console.error('getAllBlockers error:', err);
            return res.status(500).json({ message: 'Failed to fetch blockers' });
        }
    };

    /* ── ALL LISTINGS (any status) — only columns that exist in schema ── */
    getAllListings = async (_req: Request, res: Response) => {
        try {
            const result = await db.query(
                `SELECT l.id, l.status, l.rejection_reason, l.reviewed_at, l.created_at,
                    COALESCE(l.title_en, l.title_rw, l.title_fr, 'Untitled') AS title,
                    l.type, l.price_rwf, l.owner_phone, l.owner_name,
                    u.first_name AS blocker_first_name, u.last_name AS blocker_last_name,
                    u.phone AS blocker_phone,
                    rv.first_name AS reviewer_first_name, rv.last_name AS reviewer_last_name
                 FROM listings l
                 INNER JOIN blocker_profiles bp ON bp.id = l.blocker_id
                 INNER JOIN users u ON u.id = bp.user_id
                 LEFT JOIN users rv ON rv.id = l.reviewed_by
                 ORDER BY l.created_at DESC`
            );
            return res.status(200).json({ data: result.rows });
        } catch (err) {
            console.error('getAllListings error:', err);
            return res.status(500).json({ message: 'Failed to fetch listings' });
        }
    };

    /* ── ALL SUBSCRIPTIONS ── */
    getAllSubscriptions = async (_req: Request, res: Response) => {
        try {
            const result = await db.query(
                `SELECT s.id, s.plan, s.status, s.starts_at, s.expires_at, s.created_at,
                    u.first_name, u.last_name, u.phone,
                    p.amount_rwf, p.provider_reference
                 FROM subscriptions s
                 INNER JOIN blocker_profiles bp ON bp.id = s.blocker_id
                 INNER JOIN users u ON u.id = bp.user_id
                 LEFT JOIN payments p ON p.id = s.payment_id
                 ORDER BY s.created_at DESC`
            );
            return res.status(200).json({ data: result.rows });
        } catch (err) {
            console.error('getAllSubscriptions error:', err);
            return res.status(500).json({ message: 'Failed to fetch subscriptions' });
        }
    };

    /* ── HISTORY ── */
    getBlockerHistory = async (_req: Request, res: Response) => {
        try {
            const result = await db.query(
                `SELECT bp.id, bp.status, bp.national_id, bp.verification_code,
                    bp.rejection_reason, bp.admin_note, bp.contact_email,
                    bp.reviewed_at, bp.approved_at,
                    u.first_name, u.last_name, u.phone, u.email,
                    l.name AS operating_location_name,
                    rv.first_name AS reviewer_first_name, rv.last_name AS reviewer_last_name
                 FROM blocker_profiles bp
                 INNER JOIN users u ON u.id = bp.user_id
                 LEFT JOIN locations l ON l.id = bp.operating_location_id
                 LEFT JOIN users rv ON rv.id = bp.reviewed_by
                 WHERE bp.status != 'PENDING'
                 ORDER BY COALESCE(bp.reviewed_at, bp.created_at) DESC`
            );
            return res.status(200).json({ data: result.rows });
        } catch (err) {
            console.error('getBlockerHistory error:', err);
            return res.status(500).json({ message: 'Failed to fetch blocker history' });
        }
    };

    getListingHistory = async (_req: Request, res: Response) => {
        try {
            const result = await db.query(
                `SELECT l.id, l.status, l.rejection_reason, l.reviewed_at,
                    COALESCE(l.title_en, l.title_rw, l.title_fr, 'Untitled') AS title,
                    l.type, l.price_rwf,
                    u.first_name AS blocker_first_name, u.last_name AS blocker_last_name,
                    u.phone AS blocker_phone,
                    rv.first_name AS reviewer_first_name, rv.last_name AS reviewer_last_name
                 FROM listings l
                 INNER JOIN blocker_profiles bp ON bp.id = l.blocker_id
                 INNER JOIN users u ON u.id = bp.user_id
                 LEFT JOIN users rv ON rv.id = l.reviewed_by
                 WHERE l.status != 'PENDING'
                 ORDER BY COALESCE(l.reviewed_at, l.created_at) DESC`
            );
            return res.status(200).json({ data: result.rows });
        } catch (err) {
            console.error('getListingHistory error:', err);
            return res.status(500).json({ message: 'Failed to fetch listing history' });
        }
    };
}