import type { DatabaseClient } from '../config/database.js';

export interface SystemRepository {
  checkDatabase(): Promise<void>;
}

export class PostgresSystemRepository implements SystemRepository {
  constructor(private readonly database: DatabaseClient) {}

  async checkDatabase(): Promise<void> {
    await this.database.healthCheck();
  }
}
