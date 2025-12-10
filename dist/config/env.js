"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IS_PRODUCTION = exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string(),
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.string().default('5000'),
});
exports.env = envSchema.parse(process.env);
exports.IS_PRODUCTION = exports.env.NODE_ENV === 'production';
