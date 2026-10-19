import { Request, Response } from 'express';
import { PartnersRepository } from '../repositories/partners.repository';

export class PartnersController {
  constructor(private readonly partnersRepository: PartnersRepository) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const type = typeof req.query.type === 'string' ? req.query.type : undefined;
      const locationId = typeof req.query.locationId === 'string' ? req.query.locationId : undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : true;

      const partners = await this.partnersRepository.findAll({
        type,
        locationId,
        isActive,
      });

      return res.status(200).json({ data: partners });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to retrieve partners',
      });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const partner = await this.partnersRepository.findById(id);

      if (!partner) {
        return res.status(404).json({ message: 'Partner not found' });
      }

      return res.status(200).json({ data: partner });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to retrieve partner',
      });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { type, name } = req.body;
      if (!type || !name) {
        return res.status(400).json({ message: 'type and name are required' });
      }

      const partner = await this.partnersRepository.create(req.body);
      return res.status(201).json({
        message: 'Partner created successfully',
        data: partner,
      });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to create partner',
      });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const partner = await this.partnersRepository.update(id, req.body);

      if (!partner) {
        return res.status(404).json({ message: 'Partner not found' });
      }

      return res.status(200).json({
        message: 'Partner updated successfully',
        data: partner,
      });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to update partner',
      });
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const partner = await this.partnersRepository.delete(id);

      if (!partner) {
        return res.status(404).json({ message: 'Partner not found' });
      }

      return res.status(200).json({
        message: 'Partner deactivated successfully',
        data: partner,
      });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to delete partner',
      });
    }
  };
}
