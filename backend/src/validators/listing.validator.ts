import { z } from "zod";

export const createListingSchema = z
    .object({
        blockerId: z.string().uuid().optional(),
        villageId: z.string().uuid().optional(),
        type: z.string().min(1).max(100).optional(),
        category: z.string().max(100).optional(),
        subType: z.string().max(100).optional(),
        condition: z.string().max(100).optional(),
        deal: z.enum(["sale", "rent", "SALE", "RENT"]).optional(),
        rentalTerms: z.string().max(255).optional().nullable(),
        titleRw: z.string().max(255).optional(),
        titleEn: z.string().max(255).optional(),
        titleFr: z.string().max(255).optional(),
        descriptionRw: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionFr: z.string().optional(),
        priceRwf: z.coerce.number().int().positive(),
        sizeValue: z.coerce.number().positive(),
        sizeUnit: z.string().min(1).max(40).default("sqm"),
        upiNumber: z.string().max(100).optional().nullable(),
        ownerName: z.string().max(255).optional().nullable(),
        ownerPhone: z.string().max(40).optional().nullable(),
        ownershipDocumentPath: z.string().optional().nullable(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "pending", "approved", "rejected"]).optional(),
        isFeatured: z.boolean().optional(),
        isDisabled: z.boolean().optional(),
        isVip: z.boolean().optional(),
        vipWasPriceRwf: z.coerce.number().int().positive().optional().nullable(),
        vipDiscountPercent: z.coerce.number().positive().max(99).optional().nullable(),
        vipReason: z.string().max(500).optional().nullable(),
        vipEarlyAccessDays: z.coerce.number().int().positive().optional().nullable(),
    })
    .refine((data) => Boolean(data.titleRw || data.titleEn || data.titleFr), {
        message: "At least one of titleRw, titleEn, titleFr is required",
        path: ["titleEn"],
    });

export type CreateListingInput = z.infer<typeof createListingSchema>;

export const updateListingSchema = z.object({
    blockerId: z.string().uuid().optional(),
    villageId: z.string().uuid().optional(),
    type: z.string().min(1).max(100).optional(),
    category: z.string().max(100).optional().nullable(),
    subType: z.string().max(100).optional().nullable(),
    condition: z.string().max(100).optional().nullable(),
    deal: z.enum(["sale", "rent", "SALE", "RENT"]).optional(),
    rentalTerms: z.string().max(255).optional().nullable(),
    titleRw: z.string().max(255).optional().nullable(),
    titleEn: z.string().max(255).optional().nullable(),
    titleFr: z.string().max(255).optional().nullable(),
    descriptionRw: z.string().optional().nullable(),
    descriptionEn: z.string().optional().nullable(),
    descriptionFr: z.string().optional().nullable(),
    priceRwf: z.coerce.number().int().positive().optional(),
    sizeValue: z.coerce.number().positive().optional(),
    sizeUnit: z.string().min(1).max(40).optional(),
    upiNumber: z.string().max(100).optional().nullable(),
    ownerName: z.string().max(255).optional().nullable(),
    ownerPhone: z.string().max(40).optional().nullable(),
    ownershipDocumentPath: z.string().optional().nullable(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "pending", "approved", "rejected"]).optional(),
    isFeatured: z.boolean().optional(),
    isDisabled: z.boolean().optional(),
    isVip: z.boolean().optional(),
    vipWasPriceRwf: z.coerce.number().int().positive().optional().nullable(),
    vipDiscountPercent: z.coerce.number().positive().max(99).optional().nullable(),
    vipReason: z.string().max(500).optional().nullable(),
    vipEarlyAccessDays: z.coerce.number().int().positive().optional().nullable(),
});

export type UpdateListingInput = z.infer<typeof updateListingSchema>;

export const rejectListingSchema = z.object({
    rejectionReason: z.string().min(1),
});

export type RejectListingInput = z.infer<typeof rejectListingSchema>;

export const addListingPhotoSchema = z.object({
    filePath: z.string().min(1).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
});

export type AddListingPhotoSchema = z.infer<typeof addListingPhotoSchema>;