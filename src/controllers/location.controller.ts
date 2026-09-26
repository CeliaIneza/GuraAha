import { Request, Response } from "express";
import { LocationRepository } from "../repositories/location.repository";
import { LocationService } from "../services/location.service";

export class LocationController {
    constructor(private readonly locationService: LocationService) {}

    getProvinces = async (_req: Request, res: Response) => {
        try {
            const provinces = await this.locationService.getProvinces();
            return res.status(200).json({ data: provinces });
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to retrieve provinces',
            });
        }
    };

    getChildren = async (req: Request, res: Response) => {
        try {
            const children = await this.locationService.getChildren(req.params.id);
            return res.status(200).json({ data: children });
        } catch (error) {
            return res.status(404).json({
                message: error instanceof Error ? error.message: 'Failed to retrieve child locations', 
            });
        }
    };
}