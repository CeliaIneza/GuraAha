import { z } from "zod";

export const applyForBlockerSchema = z.object({
  nationalId: z
    .string()
    .trim()
    .min(1, "National ID is required")
    .max(50, "National ID is too long"),
  operatingLocationId: z.uuid("Invalid operating location ID").optional(),

  agreementDocumentPath: z
    .string()
    .trim()
    .min(1, "Agreement document path can not be empty")
    .optional(),
});

export const rejectBlockerSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(1, "Rejection reason is required")
    .max(1000, "Rejection reason should be simple and clear"),
});

export type ApplyForBlockerInput = z.infer<typeof applyForBlockerSchema>;

export type RejectBlockerInput = z.infer<typeof rejectBlockerSchema>;
