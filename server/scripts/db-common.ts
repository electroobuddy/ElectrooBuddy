import 'dotenv/config';
import { Client } from 'pg';

export function getMigrationDatabaseUrl(): string {
  const value = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
  if (!value || !/^postgres(ql)?:\/\//.test(value)) {
    throw new Error('MIGRATION_DATABASE_URL or DATABASE_URL must be a PostgreSQL connection URL');
  }
  return value;
}

export function createMigrationClient(): Client {
  return new Client({
    connectionString: getMigrationDatabaseUrl(),
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: true },
    application_name: 'electroobuddy-migrator',
  });
}
