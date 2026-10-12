import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createMigrationClient } from './db-common.js';

const dir = resolve(process.cwd(), 'database/migrations');
const client = createMigrationClient();
try {
  await client.connect();
  const exists = await client.query<{ ok: boolean }>("SELECT to_regclass('public.schema_migrations') IS NOT NULL AS ok");
  const applied = new Map<string,string>();
  if (exists.rows[0]?.ok) {
    const rows = await client.query<{version:string; checksum:string}>('SELECT version, checksum FROM public.schema_migrations ORDER BY version');
    rows.rows.forEach((row) => applied.set(row.version, row.checksum));
  }
  const files = (await readdir(dir)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  let mismatches = 0;
  for (const file of files) {
    const sql = await readFile(resolve(dir,file), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const dbChecksum = applied.get(file);
    const state = !dbChecksum ? 'PENDING' : dbChecksum === checksum ? 'APPLIED' : 'DRIFT';
    process.stdout.write(`${state.padEnd(8)} ${file}\n`);
    if (state !== 'APPLIED') mismatches += 1;
  }
  if (mismatches > 0 && process.env.DB_STATUS_STRICT === 'true') process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
