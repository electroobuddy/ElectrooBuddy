import type { AppEnv } from '../config/env.js';
import type { OpsRepository } from '../repositories/ops.repository.js';
export class OpsService {
  constructor(private readonly env: AppEnv, private readonly repository: OpsRepository) {}
  snapshot(){ return this.repository.snapshot(this.env.OPS_STALE_WORKER_MINUTES); }
}
