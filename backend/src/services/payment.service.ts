import { PaymentRepository, PaymentPurpose } from '../repositories/payment.repository';
import { PaymentProvider } from '../interface/payment-provider.interface';
import { emitPaymentCompleted } from '../provider/payment.event';

export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly provider: PaymentProvider
  ) {}

  async initiate(
    userId: string,
    phone: string,
    amountRwf: number,
    purpose: PaymentPurpose,
    metadata?: Record<string, unknown>
  ) {
    const payment = await this.paymentRepository.create({
      userId,
      provider: this.provider.name,
      amountRwf,
      purpose,
      metadata,
    });

    try {
      const result = await this.provider.initiate({
        userId,
        phone,
        amountRwf,
        internalPaymentId: payment.id,
      });

      return this.paymentRepository.setProviderReference(
        payment.id,
        result.providerReference,
        result.rawResponse
      );
    } catch (error) {
      await this.paymentRepository.markFailed(payment.id, {
        error: error instanceof Error ? error.message : 'Unknown provider error',
      });
      throw error;
    }
  }

  
  async handleWebhook(rawBody: unknown, headers: Record<string, string | string[] | undefined>) {
    const parsed = this.provider.parseCallback(rawBody, headers);

    const payment = await this.paymentRepository.findByProviderReference(parsed.providerReference);

    if (!payment) {
      throw new Error(`No payment found for provider reference ${parsed.providerReference}`);
    }

    if (parsed.status === 'FAILED') {
      await this.paymentRepository.markFailed(payment.id, parsed.rawResponse);
      return payment;
    }

    const updated = await this.paymentRepository.markCompleted(payment.id, parsed.rawResponse);

    if (!updated) {
      return payment;
    }

    await emitPaymentCompleted({
      id: updated.id,
      userId: updated.user_id,
      amountRwf: Number(updated.amount_rwf),
      purpose: updated.purpose,
      metadata: (updated.metadata ?? {}) as Record<string, unknown>,
    });

    return updated;
  }

  async getMine(userId: string) {
    return this.paymentRepository.findByUserId(userId);
  }

  async getById(paymentId: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  }
}