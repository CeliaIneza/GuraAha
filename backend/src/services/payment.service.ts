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

    // Best practice: verify requesttransactionid against database first, fallback to providerReference
    let payment = parsed.requestTransactionId
      ? await this.paymentRepository.findById(parsed.requestTransactionId)
      : null;

    if (!payment && parsed.providerReference) {
      payment = await this.paymentRepository.findByProviderReference(parsed.providerReference);
    }

    if (!payment) {
      throw new Error(
        `No payment found for requesttransactionid=${parsed.requestTransactionId ?? 'n/a'} or transactionid=${parsed.providerReference}`
      );
    }

    // Best practice: Be idempotent, if already COMPLETED, do not process again
    if (payment.status === 'COMPLETED') {
      return payment;
    }

    // Transient 'pending' callback, keep in PENDING state
    if (parsed.status === 'PENDING') {
      return payment;
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

  async syncPendingPayment(paymentId: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment || payment.status !== 'PENDING' || !payment.provider_reference) {
      return payment;
    }

    if (this.provider.checkTransactionStatus) {
      const check = await this.provider.checkTransactionStatus(payment.id, payment.provider_reference);
      if (check.status === 'COMPLETED') {
        return this.handleWebhook(
          {
            jsonpayload: {
              requesttransactionid: payment.id,
              transactionid: payment.provider_reference,
              status: 'Successfull',
              responsecode: '01',
            },
          },
          {}
        );
      } else if (check.status === 'FAILED') {
        await this.paymentRepository.markFailed(payment.id, check.rawResponse);
        return this.paymentRepository.findById(payment.id);
      }
    }

    return payment;
  }

  async getMine(userId: string) {
    const payments = await this.paymentRepository.findByUserId(userId);
    for (const p of payments) {
      if (p.status === 'PENDING' && p.provider_reference) {
        await this.syncPendingPayment(p.id).catch(() => {});
      }
    }
    return this.paymentRepository.findByUserId(userId);
  }

  async getById(paymentId: string) {
    await this.syncPendingPayment(paymentId).catch(() => {});
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  }
}