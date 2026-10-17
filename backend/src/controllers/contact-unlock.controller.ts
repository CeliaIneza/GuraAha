import { Request, Response } from 'express';
import { ContactUnlockService } from '../services/contact-unlock.service';

export class ContactUnlockController {
    constructor(private readonly contactUnlockService: ContactUnlockService) {}

    initiate = async (req: Request, res: Response) => {
        try {
            const payment = await this.contactUnlockService.initiateUnlock(
                req.user.id,
                req.params.listingId,
                req.body.type,
                req.body.phone
            );
            return res.status(201).json({
                message: 'Payment initiated — approve the USSD prompt on your phone to complete the unlock',
                data: payment,
            });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to initiate contact unlock',
            });
        }
    };

    getRevealed = async (req: Request, res: Response) => {
        try {
            const contact = await this.contactUnlockService.getRevealedContact(req.user.id, req.params.listingId);
            return res.status(200).json({ data: contact });
        } catch (error) {
            return res.status(404).json({
                message: error instanceof Error ? error.message : 'Listing not found',
            });
        }
    };

    getMine = async (req: Request, res: Response) => {
        try {
            const unlocks = await this.contactUnlockService.getMine(req.user.id);
            return res.status(200).json({ data: unlocks });
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Failed to retrieve your unlocks',
            });
        }
    };
}