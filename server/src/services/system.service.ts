import type { SystemRepository } from '../repositories/system.repository.js';

export class SystemService {
  constructor(private readonly repository: SystemRepository) {}

  getHealth() {
    return { status: 'ok', service: 'electroobuddy-api' } as const;
  }

  async getReadiness() {
    await this.repository.checkDatabase();
    return { status: 'ready', database: 'ok' } as const;
  }
}
