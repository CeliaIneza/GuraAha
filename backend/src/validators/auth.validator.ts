import { z } from "zod";

export const registerSchema = z.object({
    phone: z.string().min(8).max(30),
    email: z.string().email().optional().or(z.literal("")),
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(8),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
    .object({
        identifier: z.string().trim().min(1).optional(),
        username: z.string().trim().min(1).optional(),
        phone: z.string().trim().min(1).optional(),
        email: z.string().trim().min(1).optional(),
        password: z.string().min(1),
    })
    .refine(
        (data) =>
            Boolean(data.identifier) ||
            Boolean(data.username) ||
            Boolean(data.phone) ||
            Boolean(data.email),
        {
            message: "Username, phone, or email is required",
            path: ["identifier"],
        }
    );

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(10),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const logoutSchema = z.object({
    refreshToken: z.string().optional(),
});

export type LogoutInput = z.infer<typeof logoutSchema>;

export const createAdminSchema = registerSchema;
export type CreateAdminInput = RegisterInput;

export const verifyCodeSchema = z.object({
    code: z.string().trim().min(4).max(10),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().trim().min(1).optional(),
    identifier: z.string().trim().min(1).optional(),
});

export const resetPasswordSchema = z.preprocess(
    (val: any) => {
        if (val && typeof val === "object" && val.token && typeof val.token === "object") {
            return {
                token: val.token.token,
                password: val.token.password ?? val.password,
            };
        }
        return val;
    },
    z.object({
        token: z.string().trim().min(1),
        password: z.string().min(8),
    })
);