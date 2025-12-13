import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().default('5000'),
    JWT_SECRET: z.string(),

    AWS_REGION: z.string(),
    AWS_S3_BUCKET: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),

    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);

export const IS_PRODUCTION = env.NODE_ENV === 'production';