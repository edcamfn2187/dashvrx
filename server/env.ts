import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    PORT: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .default('3000'),

    FRONTEND_URL: z.string().url(),

    DATABASE_URL: z.string().min(1),

    JWT_SECRET: z.string().min(32),

    JWT_EXPIRES_IN: z.string().default('1h'),

    DOWNLOAD_DIR: z.string().default('downloads'),

    RATE_LIMIT_WINDOW_MS: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .default('900000'),

    RATE_LIMIT_MAX: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .default('100')
});

export const env = envSchema.parse(process.env);