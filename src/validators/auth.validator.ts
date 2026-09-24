import { z } from "zod";

export const registerSchema = z.object({
    phone: z.string().min(8).max(20),
    email: z.string().email().optional(),
    password: z.string().min(8),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
    .object({
        phone: z.string().min(8).max(20).optional(),
        email: z.string().email().optional(),
        password: z.string().min(1)
    })
    .refine((data) => Boolean(data.phone) || Boolean(data.email), {
        message: 'Either phone or email is required',
        path: ['phone'],
    });

    export type LoginInput = z.infer<typeof loginSchema>;

    export const refreshTokenSchema = z.object({
        refreshToken: z.string().min(10),
    });

    export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

    export const createAdminSchema = registerSchema;
    export type CreateAdminInput = RegisterInput;