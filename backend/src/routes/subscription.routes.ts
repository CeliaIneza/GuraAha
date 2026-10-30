import { Router } from 'express';

import { SubscriptionRepository } from '../repositories/subscription.repository';
import { BlockerRepository } from '../repositories/blocker.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { IntouchPayProvider } from '../provider/intouchpay.provider';
import { PaymentService } from '../services/payment.service';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionController } from '../controllers/subscription.controller';

import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { initiateSubscriptionSchema } from '../validators/subscription.validator';

const router = Router();

const subscriptionRepository = new SubscriptionRepository();
const blockerRepository = new BlockerRepository();
const paymentRepository = new PaymentRepository();
const intouchPayProvider = new IntouchPayProvider();
const paymentService = new PaymentService(paymentRepository, intouchPayProvider);

const subscriptionService = new SubscriptionService(subscriptionRepository, blockerRepository, paymentService);
const subscriptionController = new SubscriptionController(subscriptionService);

router.post(
    '/initiate',
    authenticate,
    requireRole('BLOCKER'),
    validate(initiateSubscriptionSchema),
    subscriptionController.initiate
);

router.get('/plans', subscriptionController.getPlans);
router.get('/mine', authenticate, requireRole('BLOCKER'), subscriptionController.getMine);
router.get('/status', authenticate, requireRole('BLOCKER'), subscriptionController.getStatus);
router.patch('/:id/cancel', authenticate, requireRole('BLOCKER'), subscriptionController.cancel);

export default router;