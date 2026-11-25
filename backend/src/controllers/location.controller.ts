import { Request, Response } from "express";
import { LocationRepository } from "../repositories/location.repository";
import { LocationService } from "../services/location.service";
import { db } from "../config/database";

export class LocationController {
    private readonly locationRepository = new LocationRepository();

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
            const children = await this.locationService.getChildren(String(req.params.id));
            return res.status(200).json({ data: children });
        } catch (error) {
            return res.status(404).json({
                message: error instanceof Error ? error.message: 'Failed to retrieve child locations', 
            });
        }
    };

    getAreaHighlights = async (_req: Request, res: Response) => {
        try {
            const data = await this.locationRepository.getAreaHighlights();
            return res.status(200).json({ data });
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to retrieve area highlights',
            });
        }
    };

    upsertAreaHighlight = async (req: Request, res: Response) => {
        try {
            const districtName = String(req.params.districtName || '').trim();
            const { provinceName, highlightsEn, highlightsRw, highlightsFr } = req.body || {};
            const toText = (v: unknown) =>
                Array.isArray(v) ? v.filter(Boolean).join('\n') : typeof v === 'string' ? v.trim() : '';

            const enStr = toText(highlightsEn);
            const rwStr = toText(highlightsRw);
            const frStr = toText(highlightsFr);

            if (!districtName || !enStr) {
                return res.status(400).json({ message: 'District name and investment highlights text are required' });
            }
            const updated = await this.locationRepository.upsertAreaHighlight(districtName, {
                provinceName,
                highlightsEn: enStr,
                highlightsRw: rwStr || enStr,
                highlightsFr: frStr || enStr,
                updatedBy: req.user?.id,
            });
            await db.query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                req.user?.id ?? null,
                `🗺️ Area page for ${districtName} updated`,
            ]).catch(() => {});
            return res.status(200).json({ message: 'Area highlights updated', data: updated });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to update area highlights',
            });
        }
    };

    addDistrict = async (req: Request, res: Response) => {
        try {
            const { province, name } = req.body || {};
            if (!province || !name) {
                return res.status(400).json({ message: 'Province and district name are required' });
            }
            const created = await this.locationRepository.addDistrict(String(province), String(name));
            await db.query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                req.user?.id ?? null,
                `➕ District ${created.name} added to ${created.province_name}`,
            ]).catch(() => {});
            return res.status(201).json({ message: 'District added', data: created });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to add district',
            });
        }
    };
}