"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('4000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    MONGODB_URI: zod_1.z.string().default('mongodb://localhost:27017/chatbuzz'),
    JWT_SECRET: zod_1.z.string().default('chatbuzz_local_secret_default_key_32_bytes_long_required'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    REFRESH_TOKEN_SECRET: zod_1.z.string().default('chatbuzz_local_refresh_secret_default_key_32_bytes_long'),
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('7d'),
    REDIS_URL: zod_1.z.string().optional(),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().default('mock_cloud'),
    CLOUDINARY_API_KEY: zod_1.z.string().default('mock_key'),
    CLOUDINARY_API_SECRET: zod_1.z.string().default('mock_secret'),
    AUTH_PROVIDER: zod_1.z.enum(['local', 'auth0']).default('local'),
    AUTH0_DOMAIN: zod_1.z.string().optional(),
    AUTH0_AUDIENCE: zod_1.z.string().optional(),
    VAPID_PUBLIC_KEY: zod_1.z.string().default('BJnbSPP7mFP1stPwyh4yEeIzh3tWTE6cAvq56Pl2oqX18QJJCen4N8gy_L_FpHQVlUbhfpXA--DH75fTGCngGqY'),
    VAPID_PRIVATE_KEY: zod_1.z.string().default('AeqH50QGvb3gmwychu7diFsWKLKUa4iFQ-aM_OGbjok'),
    VAPID_SUBJECT: zod_1.z.string().default('mailto:admin@chatbuzz.app')
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment configuration:', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
