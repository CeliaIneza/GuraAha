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
}