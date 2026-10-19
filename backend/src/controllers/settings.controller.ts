import { Request, Response } from 'express';
import { SettingsRepository } from '../repositories/settings.repository';

export class SettingsController {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  getAll = async (_req: Request, res: Response) => {
    try {
      const settings = await this.settingsRepository.getAll();
      return res.status(200).json({ data: settings });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to retrieve settings',
      });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const key = req.params.key as string;
      if (!key) {
        return res.status(400).json({ message: 'Setting key is required' });
      }

      const { value, description } = req.body;
      if (value === undefined || value === null) {
        return res.status(400).json({ message: 'Setting value is required' });
      }

      const stringValue = typeof value === 'string' ? value : String(value);
      const updated = await this.settingsRepository.upsert(
        key,
        stringValue,
        typeof description === 'string' ? description : undefined
      );

      return res.status(200).json({ data: updated });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to update setting',
      });
    }
  };
}
