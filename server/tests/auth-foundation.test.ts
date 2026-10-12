import { describe, expect, it } from 'vitest';
import { createOpaqueToken, hashOpaqueToken, hashPassword, verifyPassword } from '../src/auth/crypto.js';
import { signAccessToken, verifyAccessToken } from '../src/auth/jwt.js';
import { hasPermission } from '../src/auth/permissions.js';
import { loadEnv } from '../src/config/env.js';

const env = loadEnv({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/electroobuddy',
  DB_SSL: 'false',
  CORS_ORIGINS: 'http://localhost:5173',
  JWT_ACCESS_SECRET: '12345678901234567890123456789012',
  PUBLIC_APP_URL: 'http://localhost:5173',
  AUTH_DELIVERY_MODE: 'log'
});

describe('Phase 3 auth foundation', () => {
  it('hashes passwords with Argon2id and verifies them', async () => {
    const hash = await hashPassword('StrongPassword123');
    expect(hash).not.toBe('StrongPassword123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(verifyPassword(hash, 'StrongPassword123')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'WrongPassword123')).resolves.toBe(false);
  });

  it('creates opaque tokens and stores deterministic digests instead of raw tokens', () => {
    const token = createOpaqueToken();
    const digest = hashOpaqueToken(token);
    expect(token.length).toBeGreaterThan(40);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toContain(token);
    expect(hashOpaqueToken(token)).toBe(digest);
  });

  it('signs and validates constrained access-token claims', async () => {
    const token = await signAccessToken(env, {
      userId: '00000000-0000-4000-8000-000000000001',
      sessionId: '00000000-0000-4000-8000-000000000002',
      roles: ['admin']
    });
    await expect(verifyAccessToken(env, token)).resolves.toMatchObject({
      userId: '00000000-0000-4000-8000-000000000001',
      sessionId: '00000000-0000-4000-8000-000000000002',
      roles: ['admin']
    });
  });

  it('enforces role permission boundaries', () => {
    expect(hasPermission(['admin'], 'admin:security')).toBe(true);
    expect(hasPermission(['user'], 'admin:security')).toBe(false);
    expect(hasPermission(['technician'], 'technician:work')).toBe(true);
  });
});
