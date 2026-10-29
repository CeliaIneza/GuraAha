import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";

export class AdminController {
    constructor(
        private readonly adminService: AdminService
    ) {}

    createAdmin = async (req: Request, res: Response) => {
        try {
            const secretHeader = req.headers['x-admin-setup-secret'];
            const providedSecret = typeof secretHeader === 'string' ? secretHeader : undefined;


            const result = await this.adminService.createAdmin(req.body, providedSecret);

            return res.status(201).json({
                message: 'Admin account created',
                data: result
            });
        } catch (error) {
            return res.status(403).json({
                message: error instanceof Error ? error.message : 'Failed to create admin account'
            });
        }
    };

    getBlockers = async (req: Request, res: Response) => {
        try {
            const { page, limit, status } = req.query;
            const result = await this.adminService.getBlockers({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 20,
                status: typeof status === 'string' ? status : undefined,
            });
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to retrieve blockers'
            });
        }
    };

    getListings = async (req: Request, res: Response) => {
        try {
            const { page, limit, status } = req.query;
            const result = await this.adminService.getListings({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 20,
                status: typeof status === 'string' ? status : undefined,
            });
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to retrieve listings'
            });
        }
    };

    getSubscriptions = async (req: Request, res: Response) => {
        try {
            const { page, limit, status } = req.query;
            const result = await this.adminService.getSubscriptions({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 20,
                status: typeof status === 'string' ? status : undefined,
            });
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to retrieve subscriptions'
            });
        }
    };
}