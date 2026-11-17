import { z } from "zod";

export const createListingSchema = z
    .object({
        villageId: z.string().uuid(),
        type: z.string().min(1).max(30).transform((v) => v.toUpperCase()),
        category: z.string().max(50).optional(),
        subType: z.string().max(50).optional(),
        condition: z.string().max(50).optional(),
        titleRw: z.string().max(255).optional(),
        titleEn: z.string().max(255).optional(),
        titleFr: z.string().max(255).optional(),
        descriptionRw: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionFr: z.string().optional(),
        priceRwf: z.coerce.number().int().positive(),
        sizeValue: z.coerce.number().positive(),
        sizeUnit: z.string().min(1).max(20),
        upiNumber: z.string().max(100).optional(),
        ownerName: z.string().max(255).optional(),
        ownerPhone: z.string().max(20).optional(),
        ownershipDocumentPath: z.string().optional(),
        isVip: z.boolean().optional(),
        vipWasPriceRwf: z.coerce.number().int().positive().optional(),
        vipDiscountPercent: z.coerce.number().positive().max(99).optional(),
        vipReason: z.string().max(255).optional(),
        vipEarlyAccessDays: z.coerce.number().int().positive().optional(),
    })
    .refine((data) => Boolean(data.titleRw || data.titleEn || data.titleFr), {
        message: 'At least one of titleRw, titleEn, titleFr is required',
        path: ['titleRw']
    });

export type CreateListingInput = z.infer<typeof createListingSchema>;

export const updateListingSchema = z.object({
    type: z.string().min(1).max(30).transform((v) => v.toUpperCase()).optional(),
    category: z.string().max(50).optional(),
    subType: z.string().max(50).optional(),
    condition: z.string().max(50).optional(),
    titleRw: z.string().max(255).optional(),
    titleEn: z.string().max(255).optional(),
    titleFr: z.string().max(255).optional(),
    descriptionRw: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionFr: z.string().optional(),
    priceRwf: z.coerce.number().int().positive().optional(),
    sizeValue: z.coerce.number().positive().optional(),
    sizeUnit: z.string().min(1).max(20).optional(),
    upiNumber: z.string().max(100).optional(),
    isVip: z.boolean().optional(),
    vipWasPriceRwf: z.coerce.number().int().positive().optional(),
    vipDiscountPercent: z.coerce.number().positive().max(99).optional(),
    vipReason: z.string().max(255).optional(),
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