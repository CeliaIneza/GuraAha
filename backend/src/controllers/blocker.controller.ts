import { Request, Response } from 'express';
import { BlockerService } from '../services/blocker.service';

export class BlockerController {
    constructor(private readonly blockerService: BlockerService) {}

    apply = async (req: Request, res: Response) => {
        try {
            const application = await this.blockerService.apply(req.user?.id, req.body);

            return res.status(201).json({
                message: 'Blocker application submitted successfully',
                data: application,
            });
        } catch (error) {
            return res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to submit blocker application',
            });
        }
    };

    getMyApplication = async (req: Request, res: Response) => {
        try {
            const application = await this.blockerService.getApplicationByUserId(req.user.id);
            return res.status(200).json({ data: application });
        } catch (error) {
            return res.status(404).json({
                message:
                    error instanceof Error ? error.message : 'Blocker application not found',
            });
        }
    };

    getPendingApplications = async (_req: Request, res: Response) => {
        try {
            const applications = await this.blockerService.getPendingApplications();
            return res.status(200).json({ data: applications });
        } catch (error) {
            return res.status(500).json({
                message:
                    error instanceof Error ? error.message : 'Failed to retrieve applications',
            });
        }
    };

    approve = async (req: Request, res: Response) => {
        try {
            const result = await this.blockerService.approve(String(req.params.id), req.user.id);
            return res.status(200).json({
                message: 'Blocker application approved successfully',
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to approve application',
            });
        }
    };

    reject = async (req: Request, res: Response) => {
        try {
            const result = await this.blockerService.reject(
                String(req.params.id),
                req.user.id,
                req.body.rejectionReason || req.body.adminNote || 'Rejected by admin'
            );
            return res.status(200).json({
                message: 'Blocker application rejected',
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to reject application',
            });
        }
    };

    suspend = async (req: Request, res: Response) => {
        try {
            const result = await this.blockerService.toggleSuspend(String(req.params.id), req.user.id);
            return res.status(200).json({
                message: result.status === 'SUSPENDED' ? 'Blocker suspended' : 'Blocker reactivated',
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to toggle blocker suspension',
            });
        }
    };

    resetPassword = async (req: Request, res: Response) => {
        try {
            const result = await this.blockerService.resetPassword(
                String(req.params.id),
                req.user.id,
                req.body?.password
            );
            return res.status(200).json({
                message: 'Temporary password issued',
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to reset blocker password',
            });
        }
    };

    adminSave = async (req: Request, res: Response) => {
        try {
            const result = await this.blockerService.adminSaveBlocker(req.user.id, req.body || {});
            return res.status(200).json({
                message: 'Blocker saved successfully',
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to save blocker',
            });
        }
    };

    revise = async (req: Request, res: Response) => {
        try {
            const result = await this.blockerService.revise(
                String(req.params.id),
                req.user.id,
                req.body?.adminNote || req.body?.rejectionReason || 'Revision requested by admin'
            );
            return res.status(200).json({
                message: 'Revision requested on blocker application',
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to request revision',
            });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            await this.blockerService.delete(String(req.params.id));
            return res.status(200).json({
                message: 'Blocker application deleted successfully',
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to delete blocker application',
            });
        }
    };
}