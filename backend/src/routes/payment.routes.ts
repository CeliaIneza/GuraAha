import { Router } from 'express';

import { PaymentRepository } from '../repositories/payment.repository';
import { IntouchPayProvider } from '../provider/intouchpay.provider';
import { PaymentService } from '../services/payment.service';
import { PaymentController } from '../controllers/payment.controller';

import { authenticate } from '../middleware/authenticate';

const router = Router();

const paymentRepository = new PaymentRepository();
const intouchPayProvider = new IntouchPayProvider();
const paymentService = new PaymentService(paymentRepository, intouchPayProvider);
const paymentController = new PaymentController(paymentService);

// Public IntouchPay webhook/callback endpoints (no authentication blocking IntouchPay)
router.all('/webhook/intouchpay', paymentController.webhook);
router.all('/callback', paymentController.webhook);
router.all('/intouch', paymentController.webhook);

router.get('/mine', authenticate, paymentController.getMine);
router.get('/:id', authenticate, paymentController.getById);

export default router;