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
    CLIENT_URL: zod_1.z.string().default('http://localhost:3000'),
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
}).refine((data) => {
    if (data.AUTH_PROVIDER === 'auth0') {
        return !!data.AUTH0_DOMAIN && !!data.AUTH0_AUDIENCE;
    }
    return true;
}, {
    message: "AUTH0_DOMAIN and AUTH0_AUDIENCE are required when AUTH_PROVIDER is 'auth0'"
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment configuration:', parsed.error.format());
    process.exit(1);
}
const data = parsed.data;
// Strict credentials checks for development and production
if (data.NODE_ENV !== 'test') {
    if (data.MONGODB_URI.includes('<db_password>')) {
        console.error('❌ Environment Validation Error: MONGODB_URI contains the database password placeholder "<db_password>".');
        process.exit(1);
    }
    if (!data.CLOUDINARY_CLOUD_NAME || data.CLOUDINARY_CLOUD_NAME === 'mock_cloud' ||
        !data.CLOUDINARY_API_KEY || data.CLOUDINARY_API_KEY === 'mock_key' ||
        !data.CLOUDINARY_API_SECRET || data.CLOUDINARY_API_SECRET === 'mock_secret') {
        console.error('❌ Environment Validation Error: Cloudinary settings are missing or configured with default mock values.');
        process.exit(1);
    }
}
exports.env = data;
