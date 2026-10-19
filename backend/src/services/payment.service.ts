import { db } from '../config/database';
import { PaymentRepository } from '../repositories/payment.repository';
import { UnlockRepository } from '../repositories/unlock.repository';
import { ListingRepository } from '../repositories/listing.repository';

export type UnlockType = 'BLOCKER' | 'OWNER';

export interface InitiateUnlockInput {
  listingId: string;
  type: UnlockType;
  momoPhone: string;
  amountRwf?: number;
}

export interface ContactInfo {
  phone: string | null;
  name: string | null;
}

export interface InitiateUnlockResult {
  paymentId?: string;
  momoPhone?: string;
  amountRwf?: number;
  instructions?: string;
  message: string;
  alreadyUnlocked?: boolean;
  contact?: ContactInfo;
}

export interface ConfirmUnlockResult {
  type: UnlockType;
  contact: ContactInfo;
  phone?: string | null;
  name?: string | null;
  message?: string;
}

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly unlockRepository: UnlockRepository,
    private readonly listingRepository: ListingRepository
  ) {}

  private async getListingContact(
    listingId: string,
    type: UnlockType,
    executor: { query: typeof db.query } = db
  ): Promise<ContactInfo> {
    const result = await executor.query(
      `
      SELECT
        l.owner_phone,
        l.owner_name,
        u.phone AS blocker_phone,
        u.first_name AS blocker_first_name,
        u.last_name AS blocker_last_name
      FROM listings l
      INNER JOIN blocker_profiles bp ON bp.id = l.blocker_id
      INNER JOIN users u ON u.id = bp.user_id
      WHERE l.id = $1
      `,
      [listingId]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Listing details not found');
    }

    if (type === 'BLOCKER') {
      const blockerName = [row.blocker_first_name, row.blocker_last_name]
        .filter(Boolean)
        .join(' ')
        .trim();

      return {
        phone: row.blocker_phone ?? null,
        name: blockerName || 'Blocker',
      };
    } else {
      return {
        phone: row.owner_phone ?? null,
        name: row.owner_name ?? 'Property Owner',
      };
    }
  }

  async initiateUnlock(
    userId: string,
    input: InitiateUnlockInput
  ): Promise<InitiateUnlockResult> {
    const listing = await this.listingRepository.findById(input.listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'APPROVED') {
      throw new Error('Listing is not approved');
    }

    const existingUnlock = await this.unlockRepository.findOne(
      userId,
      input.listingId,
      input.type
    );

    if (existingUnlock) {
      const contact = await this.getListingContact(input.listingId, input.type);
      return {
        alreadyUnlocked: true,
        contact,
        message: 'Contact already unlocked',
      };
    }

    const amountRwf =
      input.amountRwf !== undefined && input.amountRwf > 0
        ? input.amountRwf
        : input.type === 'BLOCKER'
        ? 100
        : 200;

    const providerReference = `${input.momoPhone}|${input.listingId}|${input.type}`;

    const payment = await this.paymentRepository.create({
      userId,
      provider: 'MOMO',
      providerReference,
      amountRwf,
      purpose: `UNLOCK_${input.type}`,
    });

    return {
      paymentId: payment.id,
      momoPhone: input.momoPhone,
      amountRwf,
      instructions:
        'Dial *182*7*1# on your MoMo phone to complete payment, then click Confirm.',
      message:
        'Please complete your MoMo payment. Dial *182*7*1# or wait for the push notification.',
    };
  }

  async confirmUnlock(
    paymentId: string,
    userId: string
  ): Promise<ConfirmUnlockResult> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.user_id !== userId) {
      throw new Error('Payment does not belong to user');
    }

    if (payment.status === 'FAILED') {
      throw new Error('Payment failed');
    }

    if (!payment.provider_reference) {
      throw new Error('Invalid payment reference');
    }

    const parts = payment.provider_reference.split('|');
    const _momoPhone = parts[0];
    const listingId = parts[1];
    const type = parts[2] as UnlockType;

    if (!listingId || !type || (type !== 'BLOCKER' && type !== 'OWNER')) {
      throw new Error('Invalid unlock information in payment reference');
    }

    if (payment.status === 'VERIFIED') {
      const contact = await this.getListingContact(listingId, type);
      return {
        type,
        contact,
        phone: contact.phone,
        name: contact.name,
        message: 'Payment already verified',
      };
    }

    // Check if user already unlocked this contact
    const existingUnlock = await this.unlockRepository.findOne(
      userId,
      listingId,
      type
    );

    if (existingUnlock) {
      await this.paymentRepository.markVerified(paymentId);
      const contact = await this.getListingContact(listingId, type);
      return {
        type,
        contact,
        phone: contact.phone,
        name: contact.name,
      };
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      await this.paymentRepository.markVerified(paymentId, undefined, client);

      await this.unlockRepository.create(
        {
          userId,
          listingId,
          paymentId,
          type,
          amountRwf: Number(payment.amount_rwf),
        },
        client
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const contact = await this.getListingContact(listingId, type);

    return {
      type,
      contact,
      phone: contact.phone,
      name: contact.name,
    };
  }

  // Alias for compatibility
  confirmPayment = this.confirmUnlock;

  async getMyUnlocks(userId: string, listingId?: string) {
    const unlocks = listingId
      ? await this.unlockRepository.findByUserAndListing(userId, listingId)
      : await this.unlockRepository.findByUser(userId);

    const enriched = await Promise.all(
      unlocks.map(async (unlock) => {
        try {
          const contact = await this.getListingContact(
            unlock.listing_id,
            unlock.type as UnlockType
          );
          return {
            ...unlock,
            contact,
          };
        } catch {
          return unlock;
        }
      })
    );

    return enriched;
  }
}
