import { Request, Response } from "express";
import { PartnerService } from "../services/partner.service";
import { partnerQuerySchema } from "../validators/partner.validator";

export class PartnerController {
    constructor(
        private readonly partnerService: PartnerService = new PartnerService()
    ) {}

    list = async (req: Request, res: Response) => {
        try {
            const query = partnerQuerySchema.parse(req.query);
            const isAdmin = req.user?.role === "ADMIN";

            const result = await this.partnerService.listPartners(query, isAdmin);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to retrieve partners",
            });
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            const isAdmin = req.user?.role === "ADMIN";

            const partner = await this.partnerService.getPartnerById(id, isAdmin);
            return res.status(200).json({ data: partner });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to retrieve partner";
            const status = msg === "Partner not found" ? 404 : 400;
            return res.status(status).json({ message: msg });
        }
    };

    create = async (req: Request, res: Response) => {
        try {
            const partner = await this.partnerService.createPartner(req.body);
            return res.status(201).json({
                message: "Partner created successfully",
                data: partner,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to create partner",
            });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            const partner = await this.partnerService.updatePartner(id, req.body);
            return res.status(200).json({
                message: "Partner updated successfully",
                data: partner,
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to update partner";
            const status = msg === "Partner not found" ? 404 : 400;
            return res.status(status).json({ message: msg });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            const hard = req.query.hard === "true";

            await this.partnerService.deletePartner(id, hard);
            return res.status(200).json({
                message: hard ? "Partner deleted permanently" : "Partner deactivated successfully",
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to delete partner";
            const status = msg === "Partner not found" ? 404 : 400;
            return res.status(status).json({ message: msg });
        }
    };
}
