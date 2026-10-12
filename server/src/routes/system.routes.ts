import { Router } from 'express';
import type { SystemController } from '../controllers/system.controller.js';

export function createSystemRouter(controller: SystemController) {
  const router = Router();
  router.get('/health', controller.health);
  router.get('/ready', controller.ready);
  return router;
}
