import type { Logger } from 'pino';
import type { AccessTokenClaims } from '../auth/jwt.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: Logger;
      auth?: AccessTokenClaims;
    }
  }
}

export {};
