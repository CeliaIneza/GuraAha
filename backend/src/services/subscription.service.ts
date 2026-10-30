import { SubscriptionRepository } from '../repositories/subscription.repository';
import { BlockerRepository } from '../repositories/blocker.repository';
import { PaymentService } from './payment.service';
import { SettingService } from './setting.service';
import { onPaymentCompleted, CompletedPayment } from '../provider/payment.event';

export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly blockerRepository: BlockerRepository,
    private readonly paymentService: PaymentService,
    private readonly settingService: SettingService = new SettingService()
  ) {
    onPaymentCompleted('SUBSCRIPTION', this.handlePaymentCompleted);
  }

  async getPlans() {
    return this.settingService.getSubscriptionPlans();
  }

  async initiate(userId: string, phone: string, plan: string) {
    // Dynamic validation against database settings
    const planConfig = await this.settingService.getSubscriptionPlan(plan);
    if (!planConfig) {
      throw new Error(`Unknown subscription plan "${plan}"`);
    }

    const blockerProfile = await this.blockerRepository.findByUserId(userId);
    if (!blockerProfile) {
      throw new Error('No blocker profile found for this user');
    }
    if (blockerProfile.status !== 'APPROVED') {
      throw new Error('Only approved blockers can purchase a subscription');
    }

    const { priceRwf } = planConfig;

    return this.paymentService.initiate(userId, phone, priceRwf, 'SUBSCRIPTION', {
      blockerId: blockerProfile.id,
      plan: plan.toUpperCase(),
    });
  }

  private handlePaymentCompleted = async (payment: CompletedPayment) => {
    const { blockerId, plan } = payment.metadata;

    if (typeof blockerId !== 'string' || typeof plan !== 'string') {
      console.error(`SUBSCRIPTION payment ${payment.id} completed with malformed metadata`, payment.metadata);
      return;
    }

    const planConfig = await this.settingService.getSubscriptionPlan(plan);
    if (!planConfig) {
      console.error(`SUBSCRIPTION payment ${payment.id} completed with unknown plan: ${plan}`);
      return;
    }
    const { durationDays } = planConfig;
    const latest = await this.subscriptionRepository.findLatest(blockerId);
    const now = new Date();
    const startsAt = latest && new Date(latest.expires_at) > now ? new Date(latest.expires_at) : now;
    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    try {
      await this.subscriptionRepository.create({
        blockerId,
        plan: plan.toUpperCase(),
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