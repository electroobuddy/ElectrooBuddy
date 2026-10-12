import type { RequestHandler } from 'express';
import type { AppEnv } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { verifyAccessToken } from '../auth/jwt.js';
import { hasPermission, type AppRole, type Permission } from '../auth/permissions.js';
import type { AuthRepository } from '../repositories/auth.repository.js';

export function authenticate(env: AppEnv, repository: AuthRepository): RequestHandler {
  return async (req, _res, next) => {
    try {
      const header = req.header('authorization');
      if (!header?.startsWith('Bearer ')) throw new AppError(401, 'AUTH_REQUIRED', 'Authentication required');
      const claims = await verifyAccessToken(env, header.slice(7));
      const currentRoles = await repository.getActiveSessionRoles(claims.userId, claims.sessionId);
      if (!currentRoles) throw new AppError(401, 'SESSION_INVALID', 'Session is no longer active');
      req.auth = { ...claims, roles: currentRoles };
      next();
    } catch (error) {
      if (error instanceof AppError) return next(error);
      next(new AppError(401, 'INVALID_ACCESS_TOKEN', 'Access token is invalid or expired'));
    }
  };
}

export function requireRole(...roles: AppRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new AppError(401, 'AUTH_REQUIRED', 'Authentication required'));
    if (!req.auth.roles.some((role) => roles.includes(role))) return next(new AppError(403, 'FORBIDDEN', 'Insufficient role'));
    next();
  };
}

export function requirePermission(permission: Permission): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new AppError(401, 'AUTH_REQUIRED', 'Authentication required'));
    if (!hasPermission(req.auth.roles, permission)) return next(new AppError(403, 'FORBIDDEN', 'Insufficient permission'));
    next();
  };
}
