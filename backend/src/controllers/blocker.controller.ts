import { Request, Response } from 'express';
import { BlockerService } from '../services/blocker.service.js';
import { db } from '../config/database';
import {
  sendBlockerApplicationReceived,
  sendBlockerApproved,
  sendBlockerRejected,
  sendBlockerNeedsRevision,
} from '../services/email.service';

export class BlockerController {
    constructor(private readonly blockerService: BlockerService) {}

    apply = async (req: Request, res: Response) => {
        try {
            const application = await this.blockerService.apply(req.user!.id, req.body);

            // Save contactEmail if provided
            if (req.body.contactEmail) {
                await db.query(
                    `UPDATE blocker_profiles SET contact_email = $1 WHERE id = $2`,
                    [req.body.contactEmail, application.id]
                );
            }

            // Send confirmation email - fetch user info from DB
            const userRes = await db.query(
                `SELECT email, first_name, last_name FROM users WHERE id = $1`,
                [req.user!.id]
            );
            const userEmail = req.body.contactEmail || userRes.rows[0]?.email;
            const userName = `${userRes.rows[0]?.first_name || ''} ${userRes.rows[0]?.last_name || ''}`.trim();
            if (userEmail) {
                sendBlockerApplicationReceived(userEmail, userName || 'Applicant').catch(console.error);
            }

            return res.status(201).json({
                message: 'Blocker application submitted successfully',
                data: application,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to submit blocker application',
            });
        }
    };

    getMyApplication = async (req: Request, res: Response) => {
        try {
            const application = await this.blockerService.getApplicationByUserId(req.user!.id);
            return res.status(200).json({ data: application });
        } catch (error) {
            return res.status(404).json({
                message: error instanceof Error ? error.message : 'Blocker application not found',
            });
        }
    };

    getPendingApplications = async (_req: Request, res: Response) => {
        try {
            const applications = await this.blockerService.getPendingApplications();
            return res.status(200).json({ data: applications });
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to retrieve applications',
            });
        }
    };

    approve = async (req: Request, res: Response) => {
        try {
            const result = await this.blockerService.approve(req.params.id as string, req.user!.id);

            // Send approval email
            const applicantRes = await db.query(
                `SELECT u.email, u.first_name, u.last_name, bp.verification_code, bp.contact_email
                 FROM blocker_profiles bp
                 INNER JOIN users u ON u.id = bp.user_id
                 WHERE bp.id = $1`,
                [req.params.id]
            );
            if (applicantRes.rows[0]) {
                const row = applicantRes.rows[0];
                const email = row.contact_email || row.email;
                const name = `${row.first_name} ${row.last_name}`.trim();
                if (email) sendBlockerApproved(email, name, row.verification_code || 'N/A').catch(console.error);
            }

            return res.status(200).json({ message: 'Blocker application approved successfully', data: result });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to approve application',
            });
        }
    };

    reject = async (req: Request, res: Response) => {
        try {
            const result = await this.blockerService.reject(
                req.params.id as string,
                req.user!.id,
                req.body.rejectionReason
            );

            // Send rejection email
            const applicantRes = await db.query(
                `SELECT u.email, u.first_name, u.last_name, bp.contact_email
                 FROM blocker_profiles bp
                 INNER JOIN users u ON u.id = bp.user_id
                 WHERE bp.id = $1`,
                [req.params.id]
            );
            if (applicantRes.rows[0]) {
                const row = applicantRes.rows[0];
                const email = row.contact_email || row.email;
                const name = `${row.first_name} ${row.last_name}`.trim();
                if (email) sendBlockerRejected(email, name, req.body.rejectionReason || '').catch(console.error);
            }

            return res.status(200).json({ message: 'Blocker application rejected', data: result });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to reject application',
            });
        }
    };

    revise = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { adminNote } = req.body;
            if (!adminNote) return res.status(400).json({ message: 'adminNote is required' });

            await db.query(
                `UPDATE blocker_profiles SET status = 'NEEDS_REVISION', admin_note = $1,
                 reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW() WHERE id = $3`,
                [adminNote, req.user!.id, id]
            );

            const applicantRes = await db.query(
                `SELECT u.email, u.first_name, u.last_name, bp.contact_email
                 FROM blocker_profiles bp
                 INNER JOIN users u ON u.id = bp.user_id
                 WHERE bp.id = $1`,
                [id]
            );
            if (applicantRes.rows[0]) {
                const row = applicantRes.rows[0];
                const email = row.contact_email || row.email;
                const name = `${row.first_name} ${row.last_name}`.trim();
                if (email) sendBlockerNeedsRevision(email, name, adminNote).catch(console.error);
            }

            return res.status(200).json({ data: { message: 'Revision requested' } });
        } catch (error) {
            return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed' });
        }
    };
}