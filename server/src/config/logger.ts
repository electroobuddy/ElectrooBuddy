import pino from 'pino';
import type { AppEnv } from './env.js';

export function createLogger(env: Pick<AppEnv, 'LOG_LEVEL' | 'NODE_ENV'>) {
  return pino({
    level: env.LOG_LEVEL,
    base: env.NODE_ENV === 'production' ? undefined : { service: 'electroobuddy-api' },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',
        'request.headers.authorization',
        'request.headers.cookie',
        'password',
        '*.password',
        'token',
        '*.token',
        'refreshToken',
        '*.refreshToken',
        'DATABASE_URL'
      ],
      censor: '[REDACTED]'
    }
  });
}
