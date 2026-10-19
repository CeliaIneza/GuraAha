import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { PaymentRepository } from '../repositories/payment.repository';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();
const controller = new SubscriptionController(
  new SubscriptionService(new PaymentRepository(), new SubscriptionRepository())
);

router.get('/me', authenticate, controller.getMySubscription);
router.post('/initiate', authenticate, controller.initiateSubscription);
router.post('/confirm', authenticate, controller.confirmSubscription);

export default router;
