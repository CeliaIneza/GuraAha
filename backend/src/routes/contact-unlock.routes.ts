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

// This router mounts at '/' in app.ts (no prefix) because its routes span
// two different URL namespaces — /listings/:listingId/contact... and
// /contact-unlocks/mine — rather than one shared prefix like every other
// routes file in this codebase.
const router = Router();

// Constructing a fresh PaymentRepository/IntouchPayProvider/PaymentService
// here (rather than importing a shared singleton) matches how every other
// routes file in this codebase wires its own dependencies — these classes
// hold no per-instance state, so duplicating the construction is harmless.
// What DOES matter is that ContactUnlockService's constructor runs at least
// once at module load, since that's what registers its payment-completed
// handler in payment-events.ts (a module-level singleton regardless of how
// many PaymentService instances exist).
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
    '/contact-unlocks/mine',
    authenticate,
    contactUnlockController.getMine
);

export default router;