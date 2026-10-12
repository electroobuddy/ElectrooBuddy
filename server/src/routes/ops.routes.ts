import { Router } from 'express';
import type { AppEnv } from '../config/env.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { OpsController } from '../controllers/ops.controller.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
export function createOpsRouter(env:AppEnv, controller:OpsController, authRepository:AuthRepository){
 const r=Router(); r.get('/admin/ops/status',authenticate(env,authRepository),requirePermission('admin:security'),controller.snapshot); return r;
}
