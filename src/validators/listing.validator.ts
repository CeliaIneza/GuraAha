import { z } from "zod";

export const createListingSchema = z
    .object({
        villageId: z.string().uuid(),
        type: z.string().min(1).max(30),
        titleRw: z.string().max(255).optional(),
        titleEn: z.string().max(255).optional(),
        titleFr: z.string().max(255).optional(),
        descriptionRw: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionFr: z.string().optional(),
        priceRwf: z.number().int().positive(),
        sizeValue: z.number().positive(),
        sizeUnit: z.string().min(1).max(20),
        upiNumber: z.string().max(100).optional(),
        ownerName: z.string().max(255).optional(),
        ownerPhone: z.string().max(20).optional(),
        ownershipDocumentPath: z.string().optional(), 
    })
    .refine((data) => Boolean(data.titleRw || data.titleEn || data.titleFr), {
        message: 'At least one of titleRw, titleEn, titleFr is required',
        path: ['titleRw']
    });

export type CreateListingInput = z.infer<typeof createListingSchema>;

export const rejectListingSchema = z.object({
    rejectionReason: z.string().min(1),
});

export type RejectListingInput = z.infer<typeof rejectListingSchema>;

export const addListingPhotoSchema = z.object({
    filePath: z.string().min(1),
    sortOrder: z.number().int().min(0).optional(),
});

export type AddListingPhotoSchema = z.infer<typeof addListingPhotoSchema>;