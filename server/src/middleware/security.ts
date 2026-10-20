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

export function createGuestBookingRateLimiter(env: AppEnv) {
  return rateLimit({
    windowMs: env.GUEST_BOOKING_RATE_LIMIT_WINDOW_MS,
    limit: env.GUEST_BOOKING_RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({
        success: false,
        error: { code: 'GUEST_BOOKING_RATE_LIMITED', message: 'Too many booking requests from this device. Please try again later or call us directly.' },
        requestId: req.requestId
      });
    }
  });
}

const GUEST_FORM_MIN_AGE_MS = 3_000;
const GUEST_FORM_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function fakeSuccess(res: import('express').Response) {
  // Bots must not learn their submission was silently discarded.
  res.status(201).json({ success: true, data: { id: crypto.randomUUID(), status: 'pending', guest: true } });
}

export function createGuestBookingAntiBotMiddleware(env: AppEnv) {
  return async (req: import('express').Request, res: import('express').Response, next: (err?: unknown) => void) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;

      // Honeypot: hidden field only bots fill.
      if (typeof body.website === 'string' && body.website.trim().length > 0) return fakeSuccess(res);

      // Timing: real humans need more than a few seconds to fill the form.
      const formTs = typeof body.formTs === 'number' ? body.formTs : Number(body.formTs);
      const age = Date.now() - formTs;
      if (!Number.isFinite(age) || age < GUEST_FORM_MIN_AGE_MS || age > GUEST_FORM_MAX_AGE_MS) return fakeSuccess(res);

      // Cloudflare Turnstile (recommended once keys are configured; enforced when TURNSTILE_REQUIRED=true)
      if (env.TURNSTILE_SECRET_KEY) {
        const token = typeof body.captchaToken === 'string' ? body.captchaToken : '';
        if (!token) return fakeSuccess(res);
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: req.ip }),
          signal: AbortSignal.timeout(5_000)
        });
        const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
        if (!result?.success) return fakeSuccess(res);
      } else if (env.TURNSTILE_REQUIRED) {
        throw new Error('TURNSTILE_REQUIRED is set but TURNSTILE_SECRET_KEY is missing');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
