import { z } from "zod";

export const idParamSchema = z.object({ id: z.string().uuid() });
export const photoIdParamSchema = z.object({ photoId: z.string().uuid() });

export const errorResponseSchema = z.object({
    message: z.string(),
});

export const messageOnlyResponseSchema = z.object({
    message: z.string()
});


export function dataResponseSchema(dataSchema: z.ZodTypeAny = z.any()) {
    return z.object({
        message: z.string().optional(),
        data: dataSchema,
    });
}

export function paginatedDataResponseSchema(itemSchema: z.ZodTypeAny = z.any()) {
    return z.object({
        data: z.array(itemSchema),
        pagination: z.object({
            total: z.number().int(),
            page: z.number().int(),
            limit: z.number().int(),
            totalPages: z.number().int(),
        }),
    });
}

export const unauthorizedResponse = {
    description: 'Missing, malformed, or expired access token',
    content: { 'application/json' : { schema: errorResponseSchema }},
};

export const forbiddenResponse = {
    description: 'Authenticated but lacking the required role',
    content: { 'application/json': {schema: errorResponseSchema}}
};