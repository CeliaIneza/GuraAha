import { Router } from 'express';
import { PaymentRepository } from '../repositories/payment.repository';
import { UnlockRepository } from '../repositories/unlock.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { PaymentService } from '../services/payment.service';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

const paymentRepository = new PaymentRepository();
const unlockRepository = new UnlockRepository();
const listingRepository = new ListingRepository();

const paymentService = new PaymentService(
  paymentRepository,
  unlockRepository,
  listingRepository
);

const paymentController = new PaymentController(paymentService);

router.post('/unlocks/initiate', authenticate, paymentController.initiateUnlock);
router.post('/unlocks/confirm', authenticate, paymentController.confirmUnlock);
router.get('/unlocks/me', authenticate, paymentController.getMyUnlocks);

export default router;
