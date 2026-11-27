import { z } from "zod";

export const applyForBlockerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(200).optional(),
  phone: z.string().trim().min(7, "Phone number is too short").max(30).optional(),
  email: z.string().trim().email("Please enter a valid email address").optional().or(z.literal("")),
  nationalId: z
    .string()
    .trim()
    .min(1, "National ID is required")
    .max(50, "National ID is too long"),
  operatingLocationId: z.string().trim().optional().nullable(),
  areaText: z.string().trim().max(255).optional().nullable(),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(50).optional(),
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
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
