import { Router } from 'express';

import { ContactUnlockRepository } from '../repositories/contact-unlock.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { UserRepository } from '../repositories/user.repository';
import { LottoRepository } from '../repositories/lotto.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { IntouchPayProvider } from '../provider/intouchpay.provider';
import { PaymentService } from '../services/payment.service.js';
import { ContactUnlockService } from '../services/contact-unlock.service';
import { ContactUnlockController } from '../controllers/contact-unlock.controller';

import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { initiateContactUnlockSchema } from '../validators/contact-unlock.validator';

const router = Router();

const contactUnlockRepository = new ContactUnlockRepository();
const listingRepository = new ListingRepository();
const userRepository = new UserRepository();
const lottoRepository = new LottoRepository();
const paymentRepository = new PaymentRepository();
const intouchPayProvider = new IntouchPayProvider();
const paymentService = new PaymentService(paymentRepository, intouchPayProvider);

const contactUnlockService = new ContactUnlockService(
    contactUnlockRepository,
    listingRepository,
    userRepository,
    lottoRepository,
    paymentService
);

const contactUnlockController = new ContactUnlockController(contactUnlockService);

router.post(
    '/listings/:listingId/contact/unlock',
    authenticate,
    validate(initiateContactUnlockSchema),
    contactUnlockController.initiate
);

router.get(
    '/listings/:listingId/contact',
    authenticate,
    contactUnlockController.getRevealed
);

router.get(
    '/contact-unlocks/prices',
    contactUnlockController.getPricing
);

router.get(
    '/contact-unlocks/mine',
    authenticate,
    contactUnlockController.getMine
);

export default router;