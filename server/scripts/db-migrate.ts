import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createMigrationClient } from './db-common.js';

const migrationsDir = resolve(process.cwd(), 'database/migrations');
const client = createMigrationClient();

try {
  await client.connect();
  await client.query('SELECT pg_advisory_lock($1)', [90126002]);
  await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);

  const files = (await readdir(migrationsDir)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  for (const file of files) {
    const sql = await readFile(resolve(migrationsDir, file), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await client.query<{ checksum: string }>('SELECT checksum FROM public.schema_migrations WHERE version=$1', [file]);

    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(`Migration checksum mismatch for ${file}; applied migrations are immutable`);
      }
      process.stdout.write(`SKIP ${file}\n`);
      continue;
    }

    process.stdout.write(`APPLY ${file}\n`);
    await client.query(sql);
    await client.query('INSERT INTO public.schema_migrations(version, checksum) VALUES ($1,$2)', [file, checksum]);
  }
  process.stdout.write('DATABASE MIGRATIONS: PASS\n');
} finally {
  try { await client.query('SELECT pg_advisory_unlock($1)', [90126002]); } catch {}
  await client.end().catch(() => undefined);
}
