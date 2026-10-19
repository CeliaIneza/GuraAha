import { db } from '../config/database';
import { PaymentRepository } from '../repositories/payment.repository';
import { SubscriptionRepository } from '../repositories/subscription.repository';

export class SubscriptionService {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly subscriptionRepo: SubscriptionRepository
  ) {}

  private async getApprovedBlockerId(userId: string): Promise<string | null> {
    const res = await db.query(
      `SELECT id FROM blocker_profiles WHERE user_id = $1 AND status = 'APPROVED'`,
      [userId]
    );
    return res.rows[0]?.id || null;
  }

  async getActiveSubscription(userId: string) {
    const blockerId = await this.getApprovedBlockerId(userId);
    if (!blockerId) return null;
    return this.subscriptionRepo.findActiveByBlockerId(blockerId);
  }

  async initiateSubscription(userId: string, plan: 'weekly' | 'monthly', momoPhone: string) {
    const blockerId = await this.getApprovedBlockerId(userId);
    if (!blockerId) throw new Error('No approved blocker profile found');

    const existing = await this.subscriptionRepo.findActiveByBlockerId(blockerId);
    if (existing) {
      return { alreadyActive: true, subscription: existing, message: 'You already have an active subscription.' };
    }

    const amountRwf = plan === 'weekly' ? 1500 : 5000;
    const payment = await this.paymentRepo.create({
      userId,
      provider: 'MOMO',
      providerReference: `${momoPhone}|${blockerId}|${plan}`,
      amountRwf,
      purpose: 'SUBSCRIPTION',
    });

    return {
      paymentId: payment.id,
      amountRwf,
      plan,
      instructions: 'Dial *182*7*1# on your MoMo phone to complete payment, then click Confirm.',
      message: 'Please complete your MoMo payment to activate your subscription.',
    };
  }

  async confirmSubscription(paymentId: string, userId: string) {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.user_id !== userId) throw new Error('Payment does not belong to this user');
    if (payment.status === 'FAILED') throw new Error('Payment failed');
    if (!payment.provider_reference) throw new Error('Invalid payment reference');

    const parts = payment.provider_reference.split('|');
    const blockerId = parts[1];
    const plan = parts[2] as 'weekly' | 'monthly';
    if (!blockerId || !plan) throw new Error('Invalid payment reference format');

    if (payment.status === 'VERIFIED') {
      const subscription = await this.subscriptionRepo.findActiveByBlockerId(blockerId);
      return { subscription, message: 'Payment already verified' };
    }

    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    plan === 'weekly' ? expiresAt.setDate(expiresAt.getDate() + 7) : expiresAt.setDate(expiresAt.getDate() + 30);

    const client = await db.connect();
    let subscription;
    try {
      await client.query('BEGIN');
      await this.paymentRepo.markVerified(paymentId, undefined, client);
      subscription = await this.subscriptionRepo.create({ blockerId, plan, paymentId, startsAt, expiresAt }, client);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return { subscription, plan, expiresAt, message: 'Subscription activated!' };
  }
}
