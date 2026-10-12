import request from 'supertest';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { DatabaseClient } from '../src/config/database.js';
import type { AppEnv } from '../src/config/env.js';

const env: AppEnv = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: 3001,
  API_PREFIX: '/api/v1',
  LOG_LEVEL: 'silent',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  DB_SSL: false,
  DB_POOL_MAX: 2,
  DB_IDLE_TIMEOUT_MS: 30000,
  DB_CONNECTION_TIMEOUT_MS: 1000,
  CORS_ORIGINS: 'http://localhost:5173',
  TRUST_PROXY: 1,
  REQUEST_BODY_LIMIT: '1mb',
  GLOBAL_RATE_LIMIT_WINDOW_MS: 60000,
  GLOBAL_RATE_LIMIT_MAX: 120,
  AUTH_RATE_LIMIT_WINDOW_MS: 900000,
  AUTH_RATE_LIMIT_MAX: 10,
  JWT_ACCESS_SECRET: '12345678901234567890123456789012',
  JWT_ISSUER: 'electroobuddy-api',
  JWT_AUDIENCE: 'electroobuddy-web',
  JWT_ACCESS_TTL_MINUTES: 15,
  REFRESH_TOKEN_TTL_DAYS: 30,
  PASSWORD_RESET_TTL_MINUTES: 30,
  EMAIL_VERIFICATION_TTL_HOURS: 24,
  AUTH_DELIVERY_MODE: 'log',
  PUBLIC_APP_URL: 'http://localhost:5173',
  SMTP_HOST: '',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_USER: '',
  SMTP_PASSWORD: '',
  SMTP_FROM: 'ElectrooBuddy <no-reply@electroobuddy.local>',
  PUBLIC_SITE_SETTING_KEYS: 'phone_number,whatsapp_number,email',
  STORAGE_ENABLED: false,
  STORAGE_DRIVER: 's3',
  STORAGE_ENDPOINT: 'https://storage.invalid',
  STORAGE_REGION: 'auto',
  STORAGE_BUCKET: '',
  STORAGE_ACCESS_KEY_ID: '',
  STORAGE_SECRET_ACCESS_KEY: '',
  STORAGE_PUBLIC_BASE_URL: 'https://storage.invalid',
  STORAGE_FORCE_PATH_STYLE: false,
  STORAGE_MAX_IMAGE_BYTES: 5242880,
  STORAGE_UPLOAD_RATE_LIMIT_WINDOW_MS: 900000,
  STORAGE_UPLOAD_RATE_LIMIT_MAX: 30,
  corsOrigins: ['http://localhost:5173'],
  publicSiteSettingKeys: ['phone_number','whatsapp_number','email']
};

function database(ready = true): DatabaseClient {
  return {
    async query() { throw new Error('not used'); },
    async healthCheck() { if (!ready) throw new Error('database down'); },
    async close() {}
  } as DatabaseClient;
}

const logger = pino({ level: 'silent' });

describe('API foundation', () => {
  it('returns health without requiring database readiness', async () => {
    const response = await request(createApp({ env, logger, database: database(false) })).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { status: 'ok' } });
    expect(response.headers['x-request-id']).toBeTruthy();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('returns readiness when PostgreSQL is reachable', async () => {
    const response = await request(createApp({ env, logger, database: database(true) })).get('/api/v1/ready');
    expect(response.status).toBe(200);
    expect(response.body.data.database).toBe('ok');
  });

  it('returns 503 readiness without leaking database error details', async () => {
    const response = await request(createApp({ env, logger, database: database(false) })).get('/api/v1/ready');
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SERVICE_NOT_READY');
    expect(JSON.stringify(response.body)).not.toContain('database down');
  });

  it('returns stable 404 error contract', async () => {
    const response = await request(createApp({ env, logger, database: database(true) })).get('/api/v1/missing');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(response.body.requestId).toBeTruthy();
  });

  it('allows configured CORS origin and rejects arbitrary origin', async () => {
    const allowed = await request(createApp({ env, logger, database: database(true) }))
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const denied = await request(createApp({ env, logger, database: database(true) }))
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
