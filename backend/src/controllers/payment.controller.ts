import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { buildIntouchPayCallbackAck } from '../provider/intouchpay.provider';

export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    webhook = async (req: Request, res: Response) => {
        try {
            const payment = await this.paymentService.handleWebhook(req.body, req.headers as Record<string, string | string[] | undefined>);
            return res.status(200).json(buildIntouchPayCallbackAck(payment.id));
        } catch (error) {
            console.error('IntouchPay webhook handling failed:', error);
            return res.status(200).json(buildIntouchPayCallbackAck('unknown'));
        }
    };

    getMine = async (req: Request, res: Response) => {
        try {
            const payments = await this.paymentService.getMine(req.user.id);
            return res.status(200).json({ data: payments });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to retrieve payments',
            });
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const payment = await this.paymentService.getById(String(req.params.id));

            if (payment.user_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(404).json({ message: 'Payment not found' });
            }

            return res.status(200).json({ data: payment });
        } catch (error) {
            return res.status(404).json({
                message: error instanceof Error ? error.message : 'Payment not found',
            });
        }
    };
}