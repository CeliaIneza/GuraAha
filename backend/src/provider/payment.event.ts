import { PaymentPurpose } from "../repositories/payment.repository";

export interface CompletedPayment {
    id: string;
    userId: string;
    amountRwf: number;
    purpose: PaymentPurpose;
    metadata: Record<string, unknown>;
}

type PaymentCompletedHandler = (payment: CompletedPayment) => Promise<void>;

const handlers = new Map<PaymentPurpose, PaymentCompletedHandler>();
 
export function onPaymentCompleted(purpose: PaymentPurpose, handler: PaymentCompletedHandler) {
  handlers.set(purpose, handler);
}
 
export async function emitPaymentCompleted(payment: CompletedPayment) {
  const handler = handlers.get(payment.purpose);
 
  if (!handler) {
    console.error(`No handler registered for payment purpose "${payment.purpose}" (payment ${payment.id})`);
    return;
  }
 
  await handler(payment);
}