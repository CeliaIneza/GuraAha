import { z } from 'zod';

// Plan names come from SUBSCRIPTION_PLANS in payment-config.ts — keeping
// this as a plain string (validated against that object at the service
// layer, not here) means adding a plan is a one-file change instead of
// needing this enum updated too.
export const initiateSubscriptionSchema = z.object({
  plan: z.string().min(1),
  phone: z.string().min(8).max(20),
});
export type InitiateSubscriptionInput = z.infer<typeof initiateSubscriptionSchema>;