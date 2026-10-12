import request from 'supertest';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { DatabaseClient, QueryableDatabase } from '../src/config/database.js';
import { loadEnv, type AppEnv } from '../src/config/env.js';

const env: AppEnv = loadEnv({
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  CORS_ORIGINS: 'http://localhost:5173', PUBLIC_APP_URL: 'http://localhost:5173',
  JWT_ACCESS_SECRET: '12345678901234567890123456789012',
  LOG_LEVEL: 'silent', DB_SSL: 'false',
});

function database(ready = true): DatabaseClient {
  return {
    async query() { throw new Error('not used'); },
    async withTransaction<T>(operation: (tx: QueryableDatabase) => Promise<T>) { return operation({ query: async () => { throw new Error('not used'); } }); },
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
