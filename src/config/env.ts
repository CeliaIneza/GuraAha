import dotenv from 'dotenv';
import {z} from 'zod';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().min(1),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;