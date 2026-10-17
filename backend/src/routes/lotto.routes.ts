import { Router, Request, Response } from 'express';

import { LottoRepository } from '../repositories/lotto.repository.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';

// No service/controller layer here deliberately — there is no lotto
// BUSINESS LOGIC to speak of yet (no draw mechanism, no prize structure,
// nothing in the schema beyond "a row exists"). This is read-only until 
// we define how winners are chosen, how often, what they win.

const router = Router();
const lottoRepository = new LottoRepository();

router.get('/mine', authenticate, async (req: Request, res: Response) => {
    try {
        const entries = await lottoRepository.findByUserId(req.user.id);
        return res.status(200).json({ data: entries });
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : 'Failed to retrieve lotto entries',
        });
    }
});

router.get('/count', authenticate, requireRole('ADMIN'), async (_req: Request, res: Response) => {
    try {
        const count = await lottoRepository.countAll();
        return res.status(200).json({ data: { count } });
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : 'Failed to count lotto entries',
        });
    }
});

export default router;