import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';

export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    initiate = async (req: Request, res: Response) => {
        try {
            const payment = await this.subscriptionService.initiate(
                req.user.id,
                req.body.phone,
                req.body.plan
            );
            return res.status(201).json({
                message: 'Payment initiated — approve the USSD prompt on your phone to activate the plan',
                data: payment,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to initiate subscription',
            });
        }
    };

    getMine = async (req: Request, res: Response) => {
        try {
            const subscriptions = await this.subscriptionService.getMine(req.user.id);
            return res.status(200).json({ data: subscriptions });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to retrieve subscriptions',
            });
        }
    };

    getStatus = async (req: Request, res: Response) => {
        try {
            const status = await this.subscriptionService.getCurrentStatus(req.user.id);
            return res.status(200).json({ data: status });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to retrieve subscription status',
            });
        }
    };

    cancel = async (req: Request, res: Response) => {
        try {
            const cancelled = await this.subscriptionService.cancel(req.user.id, req.params.id);
            return res.status(200).json({ message: 'Subscription cancelled', data: cancelled });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to cancel subscription',
            });
        }
    };
}