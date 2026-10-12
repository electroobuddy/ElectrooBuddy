import { Router } from 'express';
import type { AppEnv } from '../config/env.js';
import type { AccountController } from '../controllers/account.controller.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

export function createAccountRouter(env: AppEnv, controller: AccountController, authRepository: AuthRepository) {
  const router = Router();
  const authenticated = authenticate(env, authRepository);
  router.get('/users/me/profile', authenticated, requirePermission('profile:read'), controller.getProfile);
  router.patch('/users/me/profile', authenticated, requirePermission('profile:write'), controller.updateProfile);
  router.get('/users/me/addresses', authenticated, requirePermission('profile:read'), controller.listAddresses);
  router.post('/users/me/addresses', authenticated, requirePermission('profile:write'), controller.createAddress);
  router.patch('/users/me/addresses/:id', authenticated, requirePermission('profile:write'), controller.updateAddress);
  router.delete('/users/me/addresses/:id', authenticated, requirePermission('profile:write'), controller.deleteAddress);
  router.post('/users/me/addresses/:id/default', authenticated, requirePermission('profile:write'), controller.setDefaultAddress);
  return router;
}
