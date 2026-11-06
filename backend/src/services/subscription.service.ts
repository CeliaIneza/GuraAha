import { SubscriptionRepository } from '../repositories/subscription.repository';
import { BlockerRepository } from '../repositories/blocker.repository';
import { PaymentService } from './payment.service';
import { SettingService } from './setting.service';
import { onPaymentCompleted, CompletedPayment } from '../provider/payment.event';
import { SubscriptionType } from '../config/payment-config';

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
    const planConfig = await this.settingService.getSubscriptionPlan(plan);
    if (!planConfig) {
      throw new Error(`Unknown subscription plan "${plan}"`);
    }

    const upperPlan = plan.toUpperCase();
    let subscriptionType: SubscriptionType = 'BLOCKER_PRO';
    if (planConfig.type) {
      subscriptionType = planConfig.type;
    } else if (upperPlan.startsWith('VIP_ROOM')) {
      subscriptionType = 'VIP_ROOM';
    } else if (upperPlan.startsWith('UNLOCK_PASS')) {
      subscriptionType = 'UNLOCK_PASS';
    }

    let blockerId: string | null = null;
    if (subscriptionType === 'BLOCKER_PRO') {
      const blockerProfile = await this.blockerRepository.findByUserId(userId);
      if (!blockerProfile) {
        throw new Error('No blocker profile found for this user. Only blockers can purchase Blocker Pro.');
      }
      if (blockerProfile.status !== 'APPROVED') {
        throw new Error('Only approved blockers can purchase a Blocker Pro subscription.');
      }
      blockerId = blockerProfile.id;
    }

    const { priceRwf } = planConfig;

    return this.paymentService.initiate(userId, phone, priceRwf, 'SUBSCRIPTION', {
      userId,
      blockerId,
      subscriptionType,
      period: planConfig.period ?? (planConfig.durationDays <= 7 ? 'WEEK' : 'MONTH'),
      plan: upperPlan,
    });
  }

  private handlePaymentCompleted = async (payment: CompletedPayment) => {
    const { userId, blockerId, plan, subscriptionType, period } = payment.metadata;

    if (typeof plan !== 'string') {
      console.error(`SUBSCRIPTION payment ${payment.id} completed without plan in metadata`, payment.metadata);
      return;
    }

    const planConfig = await this.settingService.getSubscriptionPlan(plan);
    if (!planConfig) {
      console.error(`SUBSCRIPTION payment ${payment.id} completed with unknown plan: ${plan}`);
      return;
    }
    const { durationDays } = planConfig;
    const targetUserId = (typeof userId === 'string' && userId) ? userId : payment.userId;
    const type: string = (typeof subscriptionType === 'string' && subscriptionType) ? subscriptionType : 'BLOCKER_PRO';

    // Stacking logic: if the user already has an active subscription of this type,
    // stack the new duration on top of the latest expiration date.
    const latest = await this.subscriptionRepository.findLatestByUserAndType(targetUserId, type);
    const now = new Date();
    const startsAt = latest && new Date(latest.expires_at) > now ? new Date(latest.expires_at) : now;
    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    try {
      await this.subscriptionRepository.create({
        userId: targetUserId,
        blockerId: typeof blockerId === 'string' ? blockerId : null,
        subscriptionType: type,
        period: typeof period === 'string' ? period : 'MONTH',
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
    return this.subscriptionRepository.findByUserId(userId);
  }

  async getVipStatus(userId: string) {
    const active = await this.subscriptionRepository.findActiveByUserAndType(userId, 'VIP_ROOM');
    if (!active) {
      return { isActive: false, subscription: null, remainingDays: 0 };
    }
    const now = new Date();
    const diffMs = new Date(active.expires_at).getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

    return {
      isActive: true,
      subscription: active,
      remainingDays,
      expiresAt: active.expires_at,
    };
  }

  async getCurrentStatus(userId: string) {
    const blockerProfile = await this.blockerRepository.findByUserId(userId);
    let blockerActive = null;
    if (blockerProfile) {
      blockerActive = await this.subscriptionRepository.findCurrentActive(blockerProfile.id);
    }
    const vipActive = await this.subscriptionRepository.findActiveByUserAndType(userId, 'VIP_ROOM');

    return {
      blockerSubscription: {
        isActive: Boolean(blockerActive),
        subscription: blockerActive,
      },
      vipSubscription: {
        isActive: Boolean(vipActive),
        subscription: vipActive,
      },
    };
  }

  async cancel(userId: string, subscriptionId: string) {
    const cancelled = await this.subscriptionRepository.cancel(subscriptionId, userId);
    if (!cancelled) {
      throw new Error('Subscription not found, not yours, or not currently active');
    }
    return cancelled;
  }
}