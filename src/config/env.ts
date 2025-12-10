import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().default('5000'),
});

export const env = envSchema.parse(process.env);

export const IS_PRODUCTION = env.NODE_ENV === 'production';