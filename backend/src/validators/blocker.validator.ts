import { z } from "zod";

export const applyForBlockerSchema = z.object({
  fullName: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  nationalId: z
    .string()
    .trim()
    .min(1, "National ID is required")
    .max(50, "National ID is too long"),
  operatingLocationId: z.string().trim().optional().nullable(),
  areaText: z.string().trim().max(255).optional().nullable(),
  username: z.string().trim().min(3).max(50).optional(),
  password: z.string().min(8).optional(),
  agreementDocumentPath: z.string().trim().optional().nullable(),
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
