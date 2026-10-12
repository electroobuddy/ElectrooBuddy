import type { RequestHandler } from 'express';
import type { OpsService } from '../services/ops.service.js';
export class OpsController {
  constructor(private readonly service: OpsService) {}
  snapshot: RequestHandler = async (_req,res,next)=>{ try { res.json({success:true,data:await this.service.snapshot()}); } catch(e){ next(e); } };
}
