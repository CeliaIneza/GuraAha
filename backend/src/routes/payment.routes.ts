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

// Deliberately NO `authenticate` here — IntouchPay calls this directly as a
// server-to-server webhook, with no access token of ours. We will restrict access by using the ip address of intouch's server.

router.post('/webhook/intouchpay', paymentController.webhook);

router.get('/mine', authenticate, paymentController.getMine);
router.get('/:id', authenticate, paymentController.getById);

export default router;