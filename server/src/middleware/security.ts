import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import type { AppEnv } from '../config/env.js';

export function createHelmetMiddleware() {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' }
  });
}

export function createCorsMiddleware(env: AppEnv) {
  const allowlist = new Set(env.corsOrigins);
  return cors({
    origin(origin, callback) {
      if (!origin || allowlist.has(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600
  });
}

export function createGlobalRateLimiter(env: AppEnv) {
  return rateLimit({
    windowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
    limit: env.GLOBAL_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
        requestId: req.requestId
      });
    }
  });
}

export function createAuthRateLimiter(env: AppEnv) {
  return rateLimit({
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    limit: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler(req, res) {
      res.status(429).json({
        success: false,
        error: { code: 'AUTH_RATE_LIMITED', message: 'Too many authentication attempts. Please try again later.' },
        requestId: req.requestId
      });
    }
  });
}


export function createStorageUploadRateLimiter(env: AppEnv) {
  return rateLimit({
    windowMs: env.STORAGE_UPLOAD_RATE_LIMIT_WINDOW_MS,
    limit: env.STORAGE_UPLOAD_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({
        success: false,
        error: { code: 'UPLOAD_RATE_LIMITED', message: 'Too many upload attempts. Please try again later.' },
        requestId: req.requestId
      });
    }
  });
}

export function createCheckoutRateLimiter(env: AppEnv) {
  return rateLimit({
    windowMs: env.CHECKOUT_RATE_LIMIT_WINDOW_MS,
    limit: env.CHECKOUT_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({
        success: false,
        error: { code: 'CHECKOUT_RATE_LIMITED', message: 'Too many checkout attempts. Please try again later.' },
        requestId: req.requestId
      });
    }
  });
}

export function createPublicFormRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({ success: false, error: { code: 'FORM_RATE_LIMITED', message: 'Too many form submissions. Please try again later.' }, requestId: req.requestId });
    }
  });
}

export function createPublicTrackingRateLimiter(env: AppEnv) {
  return rateLimit({
    windowMs: env.TRACKING_RATE_LIMIT_WINDOW_MS,
    limit: env.TRACKING_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({
        success: false,
        error: { code: 'TRACKING_RATE_LIMITED', message: 'Too many tracking lookups. Please try again later.' },
        requestId: req.requestId
      });
    }
  });
}
