import { Router } from 'express';
import multer from 'multer';
import type { AppEnv } from '../config/env.js';
import type { MediaController } from '../controllers/media.controller.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import { authenticate, requirePermission, requireRole } from '../middleware/auth.js';
import { createStorageUploadRateLimiter } from '../middleware/security.js';

export function createMediaRouter(env: AppEnv, controller: MediaController, authRepository: AuthRepository) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.STORAGE_MAX_IMAGE_BYTES, files: 1, fields: 4 },
  });
  router.post('/admin/media/images', createStorageUploadRateLimiter(env), authenticate(env, authRepository), requireRole('admin'), requirePermission('admin:write'), upload.single('file'), controller.uploadImage);
  router.delete('/admin/media/:id', authenticate(env, authRepository), requireRole('admin'), requirePermission('admin:write'), controller.deleteAsset);
  return router;
}
