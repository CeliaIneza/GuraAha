import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  initiateUnlock = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { listingId, type, momoPhone, amountRwf } = req.body;

      if (!listingId || !type || !momoPhone) {
        return res.status(400).json({
          message: 'listingId, type, and momoPhone are required',
        });
      }

      if (type !== 'BLOCKER' && type !== 'OWNER') {
        return res.status(400).json({
          message: 'type must be either BLOCKER or OWNER',
        });
      }

      const result = await this.paymentService.initiateUnlock(userId, {
        listingId,
        type,
        momoPhone,
        amountRwf: typeof amountRwf === 'number' ? amountRwf : undefined,
      });

      return res.status(200).json({ data: result });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to initiate unlock',
      });
    }
  };

  confirmUnlock = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          message: 'paymentId is required',
        });
      }

      const result = await this.paymentService.confirmUnlock(paymentId, userId);
      return res.status(200).json({ data: result });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to confirm unlock',
      });
    }
  };

  getMyUnlocks = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const listingId =
        typeof req.query.listingId === 'string' ? req.query.listingId : undefined;

      const result = await this.paymentService.getMyUnlocks(userId, listingId);
      return res.status(200).json({ data: result });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : 'Failed to retrieve unlocks',
      });
    }
  };
}
