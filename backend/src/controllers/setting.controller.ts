import { Request, Response } from "express";
import { SettingService } from "../services/setting.service";

export class SettingController {
    constructor(
        private readonly settingService: SettingService = new SettingService()
    ) {}

    getPublic = async (_req: Request, res: Response) => {
        try {
            const settings = await this.settingService.getPublicSettings();
            return res.status(200).json({ data: settings });
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to load public settings",
            });
        }
    };

    getAll = async (_req: Request, res: Response) => {
        try {
            const settings = await this.settingService.getAllSettings();
            return res.status(200).json({ data: settings });
        } catch (error) {
            return res.status(500).json({
                message: error instanceof Error ? error.message : "Failed to load settings",
            });
        }
    };

    getByKey = async (req: Request, res: Response) => {
        try {
            const key = req.params.key as string;
            const setting = await this.settingService.getSettingByKey(key);
            return res.status(200).json({ data: setting });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to load setting";
            const status = msg.includes("not found") ? 404 : 400;
            return res.status(status).json({ message: msg });
        }
    };

    upsert = async (req: Request, res: Response) => {
        try {
            const key = req.params.key as string;
            const { value, description } = req.body;

            const updated = await this.settingService.upsertSetting(key, value, description);
            return res.status(200).json({
                message: "Setting saved successfully",
                data: updated,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to save setting",
            });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const key = req.params.key as string;
            await this.settingService.deleteSetting(key);
            return res.status(200).json({ message: `Setting '${key}' deleted successfully` });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to delete setting";
            const status = msg.includes("not found") ? 404 : 400;
            return res.status(status).json({ message: msg });
        }
    };
}
