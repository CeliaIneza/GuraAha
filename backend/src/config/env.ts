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
    EMAIL_HOST: z.string().optional().default(''),
    EMAIL_PORT: z.coerce.number().int().positive().optional().default(587),
    EMAIL_USER: z.string().optional().default(''),
    EMAIL_PASS: z.string().optional().default(''),
    EMAIL_FROM: z.string().optional().default('GuraAha <no-reply@guraaha.com>')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
}

export const env = {
  ...parsed.data,
  EMAIL_HOST: process.env.EMAIL_HOST || '',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'GuraAha <no-reply@guraaha.com>',
};