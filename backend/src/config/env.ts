import dotenv from 'dotenv';
import {z} from 'zod';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().min(1),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

    JWT_EXPIRES_IN: z.string().min(1),

    ADMIN_SETUP_SECRET: z.string().min(3),

    INTOUCHPAY_BASE_URL: z.string().url().default('https://developer.intouchpay.co.rw/api/v1/sandbox/requestpayment/'),
    INTOUCHPAY_PARTNER_PASSWORD: z.string().min(1),
    INTOUCHPAY_USERNAME: z.string().min(1),
    INTOUCHPAY_ACCOUNT_NO: z.string().min(1),
    INTOUCHPAY_CALLBACK_URL: z.string().url().min(1),

    EMAIL_HOST: z.string().optional().default('smtp-relay.brevo.com'),
    EMAIL_PORT: z.coerce.number().int().optional().default(587),
    EMAIL_USE_TLS: z.preprocess(
        (val) => val === 'true' || val === true || val === '1',
        z.boolean()
    ).optional().default(false),
    EMAIL_HOST_USER: z.string().optional(),
    EMAIL_HOST_PASSWORD: z.string().optional(),
    DEFAULT_FROM_EMAIL: z.string().optional().default('no-reply@guraaha.rw'),

    FRONTEND_URL: z.string().optional().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;