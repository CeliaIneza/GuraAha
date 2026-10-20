import { Request, Response } from 'express';
import { BlockerService } from '../services/blocker.service.js';

export class BlockerController {
    constructor(
        private readonly blockerService: BlockerService
    ) {}

    apply = async (
        req: Request,
        res: Response
    ) => {
        try {
            const application =
                await this.blockerService.apply(
                    req.user.id,
                    req.body
                );

            return res.status(201).json({
                message:
                    'Blocker application submitted successfully',
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

    getMyApplication = async (
        req: Request,
        res: Response
    ) => {
        try {
            const application =
                await this.blockerService.getApplicationByUserId(
                    req.user.id
                );

            return res.status(200).json({
                data: application,
            });
        } catch (error) {
            return res.status(404).json({
                message:
                    error instanceof Error
                        ? error.message
                        : 'Blocker application not found',
            });
        }
    };

    getPendingApplications = async (
        _req: Request,
        res: Response
    ) => {
        try {
            const applications =
                await this.blockerService.getPendingApplications();

            return res.status(200).json({
                data: applications,
            });
        } catch (error) {
            return res.status(500).json({
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to retrieve applications',
            });
        }
    };

    approve = async (
        req: Request,
        res: Response
    ) => {
        try {
            const result =
                await this.blockerService.approve(
                    req.params.id,
                    req.user.id
                );

            return res.status(200).json({
                message:
                    'Blocker application approved successfully',
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to approve application',
            });
        }
    };

    reject = async (
        req: Request,
        res: Response
    ) => {
        try {
            const result =
                await this.blockerService.reject(
                    req.params.id,
                    req.user.id,
                    req.body.rejectionReason
                );

            return res.status(200).json({
                message:
                    'Blocker application rejected',
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to reject application',
            });
        }
    };
}