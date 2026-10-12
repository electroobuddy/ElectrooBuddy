import type { RequestHandler } from 'express';
import type { SystemService } from '../services/system.service.js';
import { AppError } from '../errors/app-error.js';

export class SystemController {
  constructor(private readonly service: SystemService) {}

  health: RequestHandler = (_req, res) => {
    res.status(200).json({ success: true, data: this.service.getHealth() });
  };

  ready: RequestHandler = async (_req, res, next) => {
    try {
      const readiness = await this.service.getReadiness();
      res.status(200).json({ success: true, data: readiness });
    } catch (error) {
      next(new AppError(503, 'SERVICE_NOT_READY', 'Service dependencies are not ready'));
    }
  };
}
