import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";
import { AdminRepository } from "../repositories/admin.repository";
import { NotificationService } from "../services/notification.service";
import { db } from "../config/database";

export class AdminController {
    private readonly adminRepo = new AdminRepository();
    private readonly notificationService = new NotificationService();

    constructor(private readonly adminService: AdminService) {}

    createAdmin = async (req: Request, res: Response) => {
        try {
            const secretHeader = req.headers["x-admin-setup-secret"];
            const providedSecret = typeof secretHeader === "string" ? secretHeader : undefined;

            const result = await this.adminService.createAdmin(req.body, providedSecret);

            return res.status(201).json({
                message: "Admin account created",
                data: result,
            });
        } catch (error) {
            return res.status(403).json({
                message: error instanceof Error ? error.message : "Failed to create admin account",
            });
        }
    };

    getBlockers = async (req: Request, res: Response) => {
        try {
            const { page, limit, status } = req.query;
            const result = await this.adminService.getBlockers({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 100,
                status: typeof status === "string" ? status : undefined,
            });
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to retrieve blockers",
            });
        }
    };

    getBlockerHistory = async (req: Request, res: Response) => {
        try {
            const { page, limit } = req.query;
            const result = await this.adminService.getBlockers({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 100,
            });
            const history = (result.data || []).filter((b: any) => b.status !== "PENDING");
            return res.status(200).json({ ...result, data: history });
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to retrieve blocker history",
            });
        }
    };

    getListings = async (req: Request, res: Response) => {
        try {
            const { page, limit, status } = req.query;
            const result = await this.adminService.getListings({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 100,
                status: typeof status === "string" ? status : undefined,
            });
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to retrieve listings",
            });
        }
    };

    getListingHistory = async (req: Request, res: Response) => {
        try {
            const { page, limit } = req.query;
            const result = await this.adminService.getListings({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 100,
            });
            const history = (result.data || []).filter((l: any) => l.status !== "PENDING");
            return res.status(200).json({ ...result, data: history });
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to retrieve listing history",
            });
        }
    };

    getSubscriptions = async (req: Request, res: Response) => {
        try {
            const { page, limit, status } = req.query;
            const result = await this.adminService.getSubscriptions({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 100,
                status: typeof status === "string" ? status : undefined,
            });
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to retrieve subscriptions",
            });
        }
    };

    getAuditLogs = async (_req: Request, res: Response) => {
        try {
            const logs = await this.adminRepo.getAuditLogs(30);
            return res.status(200).json({ data: logs });
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to retrieve audit logs",
            });
        }
    };

    getPayments = async (_req: Request, res: Response) => {
        try {
            const payments = await this.adminRepo.findAllPayments();
            return res.status(200).json({ data: payments });
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to retrieve payments",
            });
        }
    };

    refundPayment = async (req: Request, res: Response) => {
        try {
            const paymentId = String(req.params.id);
            const { rows } = await db.query(
                `UPDATE payments SET status = 'REFUNDED', updated_at = NOW() WHERE id = $1 RETURNING *`,
                [paymentId]
            );
            const payment = rows[0];
            if (!payment) {
                return res.status(404).json({ message: "Payment not found" });
            }

            // Revoke linked contact unlock or subscription
            await db.query(
                `DELETE FROM lotto_entries WHERE contact_unlock_id IN (SELECT id FROM contact_unlocks WHERE payment_id = $1)`,
                [paymentId]
            );
            await db.query(`DELETE FROM contact_unlocks WHERE payment_id = $1`, [paymentId]);
            await db.query(
                `UPDATE subscriptions SET status = 'CANCELLED', cancelled_at = NOW(), updated_at = NOW() WHERE payment_id = $1`,
                [paymentId]
            );

            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    req.user?.id ?? null,
                    `↩️ Payment ${payment.provider_reference || payment.id.slice(0, 8)} refunded (${Number(payment.amount_rwf).toLocaleString()} RWF)`,
                ])
                .catch(() => {});

            return res.status(200).json({ message: "Payment refunded and access revoked", data: payment });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to refund payment",
            });
        }
    };

    recheckPayment = async (req: Request, res: Response) => {
        try {
            const paymentId = String(req.params.id);
            const { rows } = await db.query(
                `UPDATE payments SET status = 'COMPLETED', verified_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
                [paymentId]
            );
            const payment = rows[0];
            if (!payment) {
                return res.status(404).json({ message: "Payment not found" });
            }

            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    req.user?.id ?? null,
                    `🔄 Payment ${payment.provider_reference || payment.id.slice(0, 8)} re-checked: now PAID, access granted`,
                ])
                .catch(() => {});

            return res.status(200).json({ message: "Payment marked as PAID", data: payment });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to re-check payment",
            });
        }
    };

    saveVipPromotion = async (req: Request, res: Response) => {
        try {
            const { listingId, discountPercent, wasPriceRwf, vipPriceRwf, days, reason, approveNow } = req.body || {};
            if (!listingId) {
                return res.status(400).json({ message: "Listing ID is required" });
            }

            const existingRes = await db.query(`SELECT * FROM listings WHERE id = $1`, [listingId]);
            const existing = existingRes.rows[0];
            if (!existing) {
                return res.status(404).json({ message: "Listing not found" });
            }

            let wasPrice = wasPriceRwf ? Number(wasPriceRwf) : Number(existing.vip_was_price_rwf || existing.price_rwf);
            let vipPrice = vipPriceRwf ? Number(vipPriceRwf) : Number(existing.price_rwf);

            if (discountPercent && !vipPriceRwf) {
                wasPrice = Number(existing.price_rwf);
                vipPrice = Math.round((wasPrice * (1 - Number(discountPercent) / 100)) / 1000) * 1000;
            }

            if (!(wasPrice > vipPrice)) {
                return res.status(400).json({ message: "Public price must be higher than the VIP price" });
            }

            const computedDisc = Number((((wasPrice - vipPrice) / wasPrice) * 100).toFixed(1));
            const earlyDays = Number(days) || 7;
            const nextStatus = approveNow !== undefined ? (approveNow ? "APPROVED" : "PENDING") : existing.status;

            const updatedRes = await db.query(
                `
                UPDATE listings
                SET
                    is_vip = TRUE,
                    is_featured = FALSE,
                    price_rwf = $1,
                    vip_was_price_rwf = $2,
                    vip_discount_percent = $3,
                    vip_early_access_days = $4,
                    vip_expires_at = NOW() + ($4::int * INTERVAL '1 day'),
                    vip_reason = COALESCE($5, vip_reason),
                    status = $6,
                    updated_at = NOW()
                WHERE id = $7
                RETURNING *
                `,
                [vipPrice, wasPrice, computedDisc, earlyDays, reason || null, nextStatus, listingId]
            );
            const updated = updatedRes.rows[0];
            const title = updated.title_en || updated.title_rw || updated.title_fr || "VIP Listing";

            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    req.user?.id ?? null,
                    `⭐ VIP promotion saved: "${title}" at ${vipPrice.toLocaleString()} RWF (−${computedDisc}%)`,
                ])
                .catch(() => {});

            if (approveNow) {
                this.notificationService
                    .fanOutVipDealAlert({
                        listingId: updated.id,
                        title,
                        discountPercent: computedDisc,
                        priceRwf: vipPrice,
                        daysLeft: earlyDays,
                    })
                    .catch(() => {});
            }

            return res.status(200).json({ message: "VIP promotion saved", data: updated });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to save VIP promotion",
            });
        }
    };

    endVipPromotion = async (req: Request, res: Response) => {
        try {
            const listingId = String(req.params.id);
            const { rows } = await db.query(
                `
                UPDATE listings
                SET is_vip = FALSE, vip_was_price_rwf = NULL, vip_expires_at = NULL, updated_at = NOW()
                WHERE id = $1
                RETURNING *
                `,
                [listingId]
            );
            const updated = rows[0];
            if (!updated) {
                return res.status(404).json({ message: "Listing not found" });
            }
            const title = updated.title_en || updated.title_rw || updated.title_fr || "Listing";
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    req.user?.id ?? null,
                    `🌍 "${title}" moved from the VIP Room to the public site`,
                ])
                .catch(() => {});
            return res.status(200).json({ message: "Listing moved to public site", data: updated });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to end VIP period",
            });
        }
    };

    sendVipAlert = async (req: Request, res: Response) => {
        try {
            const listingId = String(req.params.id);
            const { rows } = await db.query(`SELECT * FROM listings WHERE id = $1`, [listingId]);
            const listing = rows[0];
            if (!listing) {
                return res.status(404).json({ message: "Listing not found" });
            }
            const title = listing.title_en || listing.title_rw || listing.title_fr || "VIP Deal";
            const result = await this.notificationService.fanOutVipDealAlert({
                listingId: listing.id,
                title,
                discountPercent: listing.vip_discount_percent ? Number(listing.vip_discount_percent) : undefined,
                priceRwf: Number(listing.price_rwf),
                daysLeft: listing.vip_early_access_days || 7,
            });
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    req.user?.id ?? null,
                    `Deal alert for "${title}" sent to active VIP subscribers`,
                ])
                .catch(() => {});
            return res.status(200).json({ message: "VIP deal alert dispatched", data: result });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to send VIP alert",
            });
        }
    };

    saveSubscriber = async (req: Request, res: Response) => {
        try {
            const { id, name, phone, plan, status, expiresAt, alertDistricts } = req.body || {};
            if (!name || !phone) {
                return res.status(400).json({ message: "Subscriber name and phone are required" });
            }
            const period = String(plan || "month").toLowerCase().includes("week") ? "WEEK" : "MONTH";
            const planCode = period === "WEEK" ? "VIP_ROOM_WEEKLY" : "VIP_ROOM_MONTHLY";
            const normStatus = String(status || "ACTIVE").toUpperCase();
            const expDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + (period === "WEEK" ? 7 : 30) * 86400000);

            if (id) {
                const { rows } = await db.query(
                    `
                    UPDATE subscriptions
                    SET
                        subscriber_name = $1,
                        subscriber_phone = $2,
                        period = $3,
                        plan = $4,
                        status = $5,
                        expires_at = $6,
                        alert_districts = $7,
                        updated_at = NOW()
                    WHERE id = $8
                    RETURNING *
                    `,
                    [name.trim(), phone.trim(), period, planCode, normStatus, expDate, alertDistricts || "All of Rwanda", id]
                );
                await db
                    .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                        req.user?.id ?? null,
                        `💾 VIP subscriber ${name} updated`,
                    ])
                    .catch(() => {});
                return res.status(200).json({ message: "Subscriber updated", data: rows[0] });
            } else {
                // Find or link user if phone matches, otherwise use admin's user_id with subscriber_name/subscriber_phone
                const userMatch = await db.query(`SELECT id FROM users WHERE phone = $1 LIMIT 1`, [phone.trim()]);
                const targetUserId = userMatch.rows[0]?.id || req.user.id;
                const { rows } = await db.query(
                    `
                    INSERT INTO subscriptions (
                        user_id, subscription_type, period, plan, starts_at, expires_at, status,
                        subscriber_name, subscriber_phone, alert_districts
                    ) VALUES ($1, 'VIP_ROOM', $2, $3, NOW(), $4, $5, $6, $7, $8)
                    RETURNING *
                    `,
                    [
                        targetUserId,
                        period,
                        planCode,
                        expDate,
                        normStatus,
                        name.trim(),
                        phone.trim(),
                        alertDistricts || "All of Rwanda",
                    ]
                );
                await db
                    .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                        req.user?.id ?? null,
                        `➕ VIP subscriber ${name} added`,
                    ])
                    .catch(() => {});
                return res.status(201).json({ message: "Subscriber added", data: rows[0] });
            }
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to save subscriber",
            });
        }
    };

    extendSubscription = async (req: Request, res: Response) => {
        try {
            const subId = String(req.params.id);
            const { rows } = await db.query(`SELECT * FROM subscriptions WHERE id = $1`, [subId]);
            const sub = rows[0];
            if (!sub) return res.status(404).json({ message: "Subscription not found" });

            const days = sub.period === "WEEK" ? 7 : 30;
            const updatedRes = await db.query(
                `
                UPDATE subscriptions
                SET
                    expires_at = GREATEST(expires_at, NOW()) + ($1::int * INTERVAL '1 day'),
                    status = 'ACTIVE',
                    updated_at = NOW()
                WHERE id = $2
                RETURNING *
                `,
                [days, subId]
            );
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    req.user?.id ?? null,
                    `⏩ Subscription extended by ${days} days`,
                ])
                .catch(() => {});
            return res.status(200).json({ message: `Extended by ${days} days`, data: updatedRes.rows[0] });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to extend subscription",
            });
        }
    };

    toggleCancelSubscription = async (req: Request, res: Response) => {
        try {
            const subId = String(req.params.id);
            const { rows } = await db.query(`SELECT * FROM subscriptions WHERE id = $1`, [subId]);
            const sub = rows[0];
            if (!sub) return res.status(404).json({ message: "Subscription not found" });

            const nextStatus = sub.status === "CANCELLED" ? "ACTIVE" : "CANCELLED";
            const updatedRes = await db.query(
                `
                UPDATE subscriptions
                SET status = $1, cancelled_at = CASE WHEN $1 = 'CANCELLED' THEN NOW() ELSE NULL END, updated_at = NOW()
                WHERE id = $2
                RETURNING *
                `,
                [nextStatus, subId]
            );
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    req.user?.id ?? null,
                    nextStatus === "CANCELLED" ? `⏹ Subscription cancelled` : `▶ Subscription restored`,
                ])
                .catch(() => {});
            return res.status(200).json({ message: `Subscription ${nextStatus.toLowerCase()}`, data: updatedRes.rows[0] });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to toggle subscription status",
            });
        }
    };

    deleteSubscription = async (req: Request, res: Response) => {
        try {
            const subId = String(req.params.id);
            await db.query(`DELETE FROM subscriptions WHERE id = $1`, [subId]);
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    req.user?.id ?? null,
                    `🗑 Subscription deleted`,
                ])
                .catch(() => {});
            return res.status(200).json({ message: "Subscription deleted" });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to delete subscription",
            });
        }
    };
}