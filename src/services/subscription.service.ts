import { SubscriptionRepository } from '../repositories/subscription.repository';
import { BlockerRepository } from '../repositories/blocker.repository';
import { PaymentService } from './payment.service';
import { onPaymentCompleted, CompletedPayment } from '../provider/payment.event';
import { SUBSCRIPTION_PLANS, isValidSubscriptionPlan } from '../config/payment-config';

export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly blockerRepository: BlockerRepository,
    private readonly paymentService: PaymentService
  ) {
    onPaymentCompleted('SUBSCRIPTION', this.handlePaymentCompleted);
  }

  async initiate(userId: string, phone: string, plan: string) {
    if (!isValidSubscriptionPlan(plan)) {
      throw new Error(`Unknown subscription plan "${plan}"`);
    }

    const blockerProfile = await this.blockerRepository.findByUserId(userId);
    if (!blockerProfile) {
      throw new Error('No blocker profile found for this user');
    }
    if (blockerProfile.status !== 'APPROVED') {
      throw new Error('Only approved blockers can purchase a subscription');
    }

    const { priceRwf } = SUBSCRIPTION_PLANS[plan];

    return this.paymentService.initiate(userId, phone, priceRwf, 'SUBSCRIPTION', {
      blockerId: blockerProfile.id,
      plan,
    });
  }

  private handlePaymentCompleted = async (payment: CompletedPayment) => {
    const { blockerId, plan } = payment.metadata;

    if (typeof blockerId !== 'string' || typeof plan !== 'string' || !isValidSubscriptionPlan(plan)) {
      console.error(`SUBSCRIPTION payment ${payment.id} completed with malformed metadata`, payment.metadata);
      return;
    }

    const { durationDays } = SUBSCRIPTION_PLANS[plan];

    // Renewal stacking: if the blocker already has a subscription whose
    // window hasn't ended yet (regardless of whether a newer-but-shorter
    // one was bought in between), the new period starts when the existing
    // one would have ended, rather than restarting from now and wasting
    // whatever time was left. A brand-new subscriber just starts from now.
    const latest = await this.subscriptionRepository.findLatest(blockerId);
    const now = new Date();
    const startsAt = latest && new Date(latest.expires_at) > now ? new Date(latest.expires_at) : now;
    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    try {
      await this.subscriptionRepository.create({
        blockerId,
        plan,
        paymentId: payment.id,
        startsAt,
        expiresAt,
      });
    } catch (error) {
      console.error(`Failed to create subscription for completed payment ${payment.id}:`, error);
    }
  };

  async getMine(userId: string) {
    const blockerProfile = await this.blockerRepository.findByUserId(userId);
    if (!blockerProfile) {
      throw new Error('No blocker profile found for this user');
    }
    return this.subscriptionRepository.findByBlockerId(blockerProfile.id);
  }

  async getCurrentStatus(userId: string) {
    const blockerProfile = await this.blockerRepository.findByUserId(userId);
    if (!blockerProfile) {
      throw new Error('No blocker profile found for this user');
    }
    const active = await this.subscriptionRepository.findCurrentActive(blockerProfile.id);
    return { isActive: Boolean(active), subscription: active };
  }

  async cancel(userId: string, subscriptionId: string) {
    const blockerProfile = await this.blockerRepository.findByUserId(userId);
    if (!blockerProfile) {
      throw new Error('No blocker profile found for this user');
    }
    const cancelled = await this.subscriptionRepository.cancel(subscriptionId, blockerProfile.id);
    if (!cancelled) {
      throw new Error('Subscription not found, not yours, or not currently active');
    }
    return cancelled;
  }
}