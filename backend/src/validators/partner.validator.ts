import { z } from "zod";

export const PARTNER_TYPES = [
    "SURVEYOR",
    "NOTARY",
    "VALUER",
    "ENGINEER",
    "LEGAL_ADVISOR",
    "BROKER",
    "OTHER"
] as const;

export const createPartnerSchema = z.object({
    type: z.string().trim().min(2).max(30),
    name: z.string().trim().min(2).max(255),
    phone: z.string().trim().min(8).max(20).optional().nullable(),
    email: z.string().trim().email().optional().nullable(),
    locationId: z.string().uuid("Invalid location UUID").optional().nullable(),
    descriptionRw: z.string().max(2000).optional().nullable(),
    descriptionEn: z.string().max(2000).optional().nullable(),
    descriptionFr: z.string().max(2000).optional().nullable(),
    isCertified: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
});

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;

export const updatePartnerSchema = createPartnerSchema.partial();
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;

export const partnerQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.string().trim().optional(),
    locationId: z.string().uuid().optional(),
    isCertified: z
        .union([z.boolean(), z.enum(["true", "false"])])
        .transform((val) => (typeof val === "boolean" ? val : val === "true"))
        .optional(),
    isActive: z
        .union([z.boolean(), z.enum(["true", "false"])])
        .transform((val) => (typeof val === "boolean" ? val : val === "true"))
        .optional(),
    search: z.string().trim().optional(),
});

export type PartnerQueryParams = z.infer<typeof partnerQuerySchema>;
