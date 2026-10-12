import { describe, it, expect } from 'vitest';
import { hasPermission } from '../auth/permissions.js';
import { requirePermission, requireRole } from '../middleware/auth.js';

describe('A5 role/permission security', () => {
  it('does not grant admin powers to ordinary users or technicians', () => {
    for (const role of ['user', 'technician'] as const) {
      expect(hasPermission([role], 'admin:read')).toBe(false);
      expect(hasPermission([role], 'admin:write')).toBe(false);
      expect(hasPermission([role], 'admin:security')).toBe(false);
    }
  });
  it('does not grant technician actions to ordinary users', () => {
    expect(hasPermission(['user'], 'technician:work')).toBe(false);
    expect(hasPermission(['technician'], 'technician:work')).toBe(true);
  });
  it('rejects unauthenticated requests at permission middleware', () => {
    const next = (error?: unknown) => { expect(error).toMatchObject({ statusCode: 401, code: 'AUTH_REQUIRED' }); };
    requirePermission('admin:write')({ auth: undefined } as any, {} as any, next);
  });
  it('rejects a technician requesting admin role and admin write', () => {
    const req = { auth: { roles: ['technician'] } } as any;
    requireRole('admin')(req, {} as any, (error?: any) => expect(error).toMatchObject({ statusCode: 403 }));
    requirePermission('admin:write')(req, {} as any, (error?: any) => expect(error).toMatchObject({ statusCode: 403 }));
  });
});
