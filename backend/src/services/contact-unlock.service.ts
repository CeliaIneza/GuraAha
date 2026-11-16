import { ContactUnlockRepository } from '../repositories/contact-unlock.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { UserRepository } from '../repositories/user.repository';
import { LottoRepository } from '../repositories/lotto.repository';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PaymentService } from './payment.service';
import { SettingService } from './setting.service';
import { onPaymentCompleted, CompletedPayment } from '../provider/payment.event';
import { ContactUnlockType } from '../config/payment-config';
import { db } from '../config/database';

function isContactUnlockType(value: unknown): value is ContactUnlockType {
  return value === 'OWNER' || value === 'BLOCKER';
}

export class ContactUnlockService {
  constructor(
    private readonly contactUnlockRepository: ContactUnlockRepository,
    private readonly listingRepository: ListingRepository,
    private readonly userRepository: UserRepository,
    private readonly lottoRepository: LottoRepository,
    private readonly paymentService: PaymentService,
    private readonly settingService: SettingService = new SettingService(),
    private readonly subscriptionRepository: SubscriptionRepository = new SubscriptionRepository()
  ) {
    onPaymentCompleted('CONTACT_UNLOCK', this.handlePaymentCompleted);
  }

  async getPricing(): Promise<Record<ContactUnlockType, number>> {
    return this.settingService.getContactUnlockPrices();
  }

  async initiateUnlock(userId: string, listingId: string, type: ContactUnlockType, phone: string) {
    const listing = await this.listingRepository.findByIdWithOwner(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }
    if (listing.status !== 'APPROVED') {
      throw new Error('Only approved listings can have their contact unlocked');
    }
    if (listing.is_disabled) {
      throw new Error('This listing is currently disabled or on hold');
    }

    const existing = await this.contactUnlockRepository.findByUserAndListing(userId, listingId, type);
    if (existing) {
      throw new Error('You have already unlocked this contact');
    }

    const now = new Date();
    const isVipExclusive = Boolean(listing.is_vip && (!listing.vip_expires_at || new Date(listing.vip_expires_at) > now));

    if (isVipExclusive) {
      const isVipUser = await this.subscriptionRepository.hasActiveVip(userId);
      if (!isVipUser) {
        throw new Error('This is a VIP Room exclusive deal. Active VIP subscription required to access contacts.');
      }

      // VIP Subscriber Perk: Free contact unlocks (0 RWF) + Double Lotto entries (2 entries)
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        const unlock = await this.contactUnlockRepository.create(
          {
            userId,
            listingId,
            paymentId: null,
            type,
            amountRwf: 0,
          },
          client
        );

        // Double lotto entry for VIP unlocks
        await this.lottoRepository.create(userId, unlock.id, client);
        await this.lottoRepository.create(userId, unlock.id, client);

        await client.query('COMMIT');

        return {
          status: 'UNLOCKED',
          isVipFree: true,
          lottoEntriesGranted: 2,
          unlock,
        };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // Standard listing: dynamic price lookup from database settings table
    const amountRwf = await this.settingService.getContactUnlockPrice(type);

    return this.paymentService.initiate(userId, phone, amountRwf, 'CONTACT_UNLOCK', {
      listingId,
      type,
    });
  }

  private handlePaymentCompleted = async (payment: CompletedPayment) => {
    const { listingId, type } = payment.metadata;

    if (typeof listingId !== 'string' || !isContactUnlockType(type)) {
      console.error(`CONTACT_UNLOCK payment ${payment.id} completed with malformed metadata`, payment.metadata);
      return;
    }

    const existingForPayment = await this.contactUnlockRepository.findByPaymentId(payment.id);
    if (existingForPayment) {
      return;
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const unlock = await this.contactUnlockRepository.create(
        {
          userId: payment.userId,
          listingId,
          paymentId: payment.id,
          type,
          amountRwf: payment.amountRwf,
        },
        client
      );

      await this.lottoRepository.create(payment.userId, unlock.id, client);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Failed to create contact unlock for completed payment ${payment.id}:`, error);
    } finally {
      client.release();
    }
  };

  async getRevealedContact(userId: string, listingId: string) {
    const listing = await this.listingRepository.findByIdWithOwner(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    const [ownerUnlock, blockerUnlock] = await Promise.all([
      this.contactUnlockRepository.findByUserAndListing(userId, listingId, 'OWNER'),
      this.contactUnlockRepository.findByUserAndListing(userId, listingId, 'BLOCKER'),
    ]);

    const result: Record<string, unknown> = {};

    if (ownerUnlock) {
      result.ownerName = listing.owner_name;
      result.ownerPhone = listing.owner_phone;
    }

    if (blockerUnlock) {
      const blockerUser = await this.userRepository.findById(listing.owner_user_id);
      result.blockerPhone = blockerUser?.phone ?? null;
    }

    return result;
  }

  async getMine(userId: string) {
    return this.contactUnlockRepository.findByUserId(userId);
  }
}