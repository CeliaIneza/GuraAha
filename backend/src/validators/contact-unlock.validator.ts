import { z } from 'zod';

export const initiateContactUnlockSchema = z.object({
  type: z.enum(['OWNER', 'BLOCKER']),
  phone: z.string().min(8).max(20),
});
export type InitiateContactUnlockInput = z.infer<typeof initiateContactUnlockSchema>;