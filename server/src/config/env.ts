import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/chatbuzz'),
  JWT_SECRET: z.string().default('chatbuzz_local_secret_default_key_32_bytes_long_required'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().default('chatbuzz_local_refresh_secret_default_key_32_bytes_long'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  REDIS_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().default('mock_cloud'),
  CLOUDINARY_API_KEY: z.string().default('mock_key'),
  CLOUDINARY_API_SECRET: z.string().default('mock_secret'),
  AUTH_PROVIDER: z.enum(['local', 'auth0']).default('local'),
  AUTH0_DOMAIN: z.string().optional(),
  AUTH0_AUDIENCE: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().default('BJnbSPP7mFP1stPwyh4yEeIzh3tWTE6cAvq56Pl2oqX18QJJCen4N8gy_L_FpHQVlUbhfpXA--DH75fTGCngGqY'),
  VAPID_PRIVATE_KEY: z.string().default('AeqH50QGvb3gmwychu7diFsWKLKUa4iFQ-aM_OGbjok'),
  VAPID_SUBJECT: z.string().default('mailto:admin@chatbuzz.app')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
