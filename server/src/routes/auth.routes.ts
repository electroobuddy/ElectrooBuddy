import { Router } from 'express';
import type { AppEnv } from '../config/env.js';
import type { AuthController } from '../controllers/auth.controller.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import { authenticate } from '../middleware/auth.js';
import { createAuthRateLimiter } from '../middleware/security.js';

export function createAuthRouter(env: AppEnv, controller: AuthController, repository: AuthRepository) {
  const router = Router();
  const sensitiveLimiter = createAuthRateLimiter(env);
  const authenticated = authenticate(env, repository);
  router.post('/auth/register', sensitiveLimiter, controller.register);
  router.post('/auth/login', sensitiveLimiter, controller.login);
  router.post('/auth/refresh', sensitiveLimiter, controller.refresh);
  router.post('/auth/password-reset/request', sensitiveLimiter, controller.requestPasswordReset);
  router.post('/auth/password-reset/confirm', sensitiveLimiter, controller.resetPassword);
  router.post('/auth/email-verification/resend', sensitiveLimiter, controller.resendVerification);
  router.post('/auth/email-verification/verify', sensitiveLimiter, controller.verifyEmail);
  router.post('/auth/logout', authenticated, controller.logout);
  router.post('/auth/logout-all', authenticated, controller.logoutAll);
  router.get('/auth/me', authenticated, controller.me);
  return router;
}
