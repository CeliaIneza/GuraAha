import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';

export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  getMySubscription = async (req: Request, res: Response) => {
    try {
      const subscription = await this.subscriptionService.getActiveSubscription(req.user!.id);
      return res.status(200).json({ data: subscription });
    } catch {
      return res.status(200).json({ data: null });
    }
  };

  initiateSubscription = async (req: Request, res: Response) => {
    try {
      const { plan, momoPhone } = req.body;
      if (!plan || !['weekly', 'monthly'].includes(plan)) {
        return res.status(400).json({ message: 'plan must be weekly or monthly' });
      }
      if (!momoPhone) return res.status(400).json({ message: 'momoPhone is required' });
      const result = await this.subscriptionService.initiateSubscription(req.user!.id, plan, momoPhone);
      return res.status(200).json({ data: result });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed' });
    }
  };

  confirmSubscription = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.body;
      if (!paymentId) return res.status(400).json({ message: 'paymentId is required' });
      const result = await this.subscriptionService.confirmSubscription(paymentId, req.user!.id);
      return res.status(200).json({ data: result });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : 'Failed' });
    }
  };
}
