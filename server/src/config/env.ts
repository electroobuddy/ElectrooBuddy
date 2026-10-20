import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_PREFIX: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/).default('/api/v1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().url().startsWith('postgresql://').or(z.string().url().startsWith('postgres://')),
  DB_SSL: booleanFromString.default(true),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(300000).default(30000),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(500).max(60000).default(5000),
  CORS_ORIGINS: z.string().min(1),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(1),
  REQUEST_BODY_LIMIT: z.string().regex(/^\d+(kb|mb)$/i).default('1mb'),
  GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(60000).default(900000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100).default(10),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().min(1).default('electroobuddy-api'),
  JWT_AUDIENCE: z.string().min(1).default('electroobuddy-web'),
  JWT_ACCESS_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  AUTH_REFRESH_COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/).default('electroobuddy_refresh'),
  AUTH_REFRESH_COOKIE_SAME_SITE: z.enum(['lax','strict','none']).default('lax'),
  AUTH_REFRESH_COOKIE_DOMAIN: z.string().default(''),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(10).max(120).default(30),
  EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().int().min(1).max(72).default(24),
  AUTH_DELIVERY_MODE: z.enum(['log', 'smtp']).default('log'),
  PUBLIC_APP_URL: z.string().url(),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: booleanFromString.default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM: z.string().min(1).default('ElectrooBuddy <no-reply@electroobuddy.local>'),
  PUBLIC_SITE_SETTING_KEYS: z.string().default('phone_number,whatsapp_number,email,facebook_url,instagram_url,youtube_url,linkedin_url,x_url,address,business_hours'),
  STORAGE_ENABLED: booleanFromString.default(false),
  STORAGE_DRIVER: z.enum(['s3']).default('s3'),
  STORAGE_ENDPOINT: z.string().url().default('https://storage.invalid'),
  STORAGE_REGION: z.string().min(1).default('auto'),
  STORAGE_BUCKET: z.string().default(''),
  STORAGE_ACCESS_KEY_ID: z.string().default(''),
  STORAGE_SECRET_ACCESS_KEY: z.string().default(''),
  STORAGE_PUBLIC_BASE_URL: z.string().url().default('https://storage.invalid'),
  STORAGE_FORCE_PATH_STYLE: booleanFromString.default(false),
  STORAGE_MAX_IMAGE_BYTES: z.coerce.number().int().min(262144).max(10485760).default(5242880),
  STORAGE_UPLOAD_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(60000).default(900000),
  STORAGE_UPLOAD_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(200).default(30),
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),
  CHECKOUT_QUOTE_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(20),
  CHECKOUT_MAX_ITEMS: z.coerce.number().int().min(1).max(100).default(50),
  CHECKOUT_MAX_QUANTITY_PER_PRODUCT: z.coerce.number().int().min(1).max(100).default(20),
  CHECKOUT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  CHECKOUT_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(200).default(20),
  TRACKING_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  TRACKING_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(200).default(20),
  PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
  SHIPROCKET_EMAIL: z.string().default(''),
  SHIPROCKET_PASSWORD: z.string().default(''),
  SHIPROCKET_PICKUP_LOCATION: z.string().min(1).default('Primary'),
  SHIPROCKET_WEBHOOK_TOKEN: z.string().default(''),
  FULFILLMENT_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
  FULFILLMENT_RETRY_MINUTES: z.coerce.number().int().min(1).max(1440).default(5),
  FULFILLMENT_STALE_LOCK_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
  FULFILLMENT_WORKER_BATCH: z.coerce.number().int().min(1).max(200).default(25),
  FIREBASE_PROJECT_ID: z.string().default(''),
  FIREBASE_CLIENT_EMAIL: z.string().default(''),
  FIREBASE_PRIVATE_KEY: z.string().default(''),
  NOTIFICATION_WORKER_BATCH: z.coerce.number().int().min(1).max(200).default(25),
  WORKER_LEASE_SECONDS: z.coerce.number().int().min(30).max(7200).default(900),
  OPS_ALERT_WEBHOOK_URL: z.string().url().or(z.literal('')).default(''),
  OPS_ALERT_TIMEOUT_MS: z.coerce.number().int().min(500).max(30000).default(5000),
  OPS_STALE_WORKER_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
  GUEST_BOOKING_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(60000).default(900000),
  GUEST_BOOKING_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(50).default(5),
  TURNSTILE_SECRET_KEY: z.string().default(''),
  TURNSTILE_REQUIRED: booleanFromString.default(false),
});

export type AppEnv = z.infer<typeof envSchema> & { corsOrigins: string[]; publicSiteSettingKeys: string[] };

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid server environment: ${details}`);
  }

  const corsOrigins = result.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (result.data.NODE_ENV === 'production') {
    const productionUrls = [result.data.PUBLIC_APP_URL, result.data.PUBLIC_API_URL];
    if (productionUrls.some((value) => !value.startsWith('https://') || /localhost|127\.0\.0\.1/i.test(value))) {
      throw new Error('Invalid server environment: production PUBLIC_APP_URL and PUBLIC_API_URL must use non-local HTTPS URLs');
    }
    if (!result.data.DB_SSL) {
      throw new Error('Invalid server environment: DB_SSL must be true in production');
    }
    if (result.data.TRUST_PROXY < 1) {
      throw new Error('Invalid server environment: TRUST_PROXY must be at least 1 in production');
    }
    if (/replace-with|change-me|changeme|example/i.test(result.data.JWT_ACCESS_SECRET)) {
      throw new Error('Invalid server environment: JWT_ACCESS_SECRET still looks like a placeholder');
    }
  }

  if (result.data.NODE_ENV === 'production' && result.data.AUTH_DELIVERY_MODE !== 'smtp') {
    throw new Error('Invalid server environment: production AUTH_DELIVERY_MODE must be smtp');
  }

  if (result.data.AUTH_DELIVERY_MODE === 'smtp' && (!result.data.SMTP_HOST || !result.data.SMTP_USER || !result.data.SMTP_PASSWORD)) {
    throw new Error('Invalid server environment: SMTP_HOST, SMTP_USER and SMTP_PASSWORD are required in smtp delivery mode');
  }

  if (result.data.STORAGE_ENABLED && (!result.data.STORAGE_BUCKET || !result.data.STORAGE_ACCESS_KEY_ID || !result.data.STORAGE_SECRET_ACCESS_KEY || result.data.STORAGE_ENDPOINT.includes('storage.invalid') || result.data.STORAGE_PUBLIC_BASE_URL.includes('storage.invalid'))) {
    throw new Error('Invalid server environment: STORAGE_* endpoint, bucket, credentials and public base URL are required when STORAGE_ENABLED=true');
  }

  if ((result.data.RAZORPAY_KEY_ID || result.data.RAZORPAY_KEY_SECRET || result.data.RAZORPAY_WEBHOOK_SECRET) && (!result.data.RAZORPAY_KEY_ID || !result.data.RAZORPAY_KEY_SECRET)) {
    throw new Error('Invalid server environment: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured together');
  }
  if (result.data.NODE_ENV === 'production' && result.data.RAZORPAY_KEY_ID && !result.data.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('Invalid server environment: RAZORPAY_WEBHOOK_SECRET is required when Razorpay is enabled in production');
  }
  const firebaseParts=[result.data.FIREBASE_PROJECT_ID,result.data.FIREBASE_CLIENT_EMAIL,result.data.FIREBASE_PRIVATE_KEY].filter(Boolean).length;
  if (firebaseParts > 0 && firebaseParts < 3) {
    throw new Error('Invalid server environment: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be configured together');
  }
  if ((result.data.SHIPROCKET_EMAIL || result.data.SHIPROCKET_PASSWORD || result.data.SHIPROCKET_WEBHOOK_TOKEN) && (!result.data.SHIPROCKET_EMAIL || !result.data.SHIPROCKET_PASSWORD)) {
    throw new Error('Invalid server environment: SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be configured together');
  }
  if (result.data.NODE_ENV === 'production' && result.data.SHIPROCKET_EMAIL && !result.data.SHIPROCKET_WEBHOOK_TOKEN) {
    throw new Error('Invalid server environment: SHIPROCKET_WEBHOOK_TOKEN is required when Shiprocket is enabled in production');
  }

  if (result.data.TURNSTILE_REQUIRED && !result.data.TURNSTILE_SECRET_KEY) {
    throw new Error('Invalid server environment: TURNSTILE_SECRET_KEY is required when TURNSTILE_REQUIRED=true');
  }

  if (corsOrigins.length === 0 || corsOrigins.includes('*')) {
    throw new Error('Invalid server environment: CORS_ORIGINS must contain explicit origins and must not contain *');
  }
  if (result.data.NODE_ENV === 'production' && corsOrigins.some((origin) => !origin.startsWith('https://') || /localhost|127\.0\.0\.1/i.test(origin))) {
    throw new Error('Invalid server environment: production CORS_ORIGINS must contain only non-local HTTPS origins');
  }

  const publicSiteSettingKeys = [...new Set(result.data.PUBLIC_SITE_SETTING_KEYS.split(',').map((key) => key.trim()).filter(Boolean))];
  if (publicSiteSettingKeys.length === 0) {
    throw new Error('Invalid server environment: PUBLIC_SITE_SETTING_KEYS must contain at least one key');
  }

  return { ...result.data, corsOrigins, publicSiteSettingKeys };
}
