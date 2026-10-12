import os from 'node:os';
import type { DatabaseClient } from '../config/database.js';
import type { Logger } from 'pino';
import type { AppEnv } from '../config/env.js';

export type WorkerResult = { processed?: number; [key: string]: unknown } | void;

async function postAlert(env: AppEnv, payload: Record<string, unknown>) {
  if (!env.OPS_ALERT_WEBHOOK_URL) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.OPS_ALERT_TIMEOUT_MS);
  try {
    await fetch(env.OPS_ALERT_WEBHOOK_URL, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload), signal: controller.signal
    });
  } finally { clearTimeout(timer); }
}

export async function runManagedWorker(
  env: AppEnv, db: DatabaseClient, logger: Logger, workerName: string,
  operation: () => Promise<WorkerResult>
) {
  const owner = `${os.hostname()}:${process.pid}`;
  const leaseSeconds = env.WORKER_LEASE_SECONDS;
  const lease = await db.query<{ acquired: boolean }>(`
    INSERT INTO ops_worker_leases(worker_name, lease_owner, lease_until)
    VALUES ($1,$2,now()+($3::text || ' seconds')::interval)
    ON CONFLICT (worker_name) DO UPDATE SET lease_owner=EXCLUDED.lease_owner, lease_until=EXCLUDED.lease_until, updated_at=now()
    WHERE ops_worker_leases.lease_until < now() OR ops_worker_leases.lease_owner = EXCLUDED.lease_owner
    RETURNING true AS acquired`, [workerName, owner, String(leaseSeconds)]);
  if (!lease.rowCount) {
    logger.warn({ workerName }, 'Worker skipped because another lease is active');
    return { skipped: true };
  }

  const started = Date.now();
  const run = await db.query<{ id: string }>(
    `INSERT INTO ops_worker_runs(worker_name,status,metadata) VALUES($1,'running',$2::jsonb) RETURNING id`,
    [workerName, JSON.stringify({ owner })]
  );
  const runRow = run.rows[0]; if (!runRow) throw new Error('Worker run creation returned no row'); const runId = runRow.id;
  // Renew the lease while the worker is active. Treat lease loss as a failure.
  let leaseFailure: Error | null = null;
  let renewing = false;
  const heartbeat = setInterval(() => {
    if (renewing || leaseFailure) return;
    renewing = true;
    void db.query(`UPDATE ops_worker_leases SET lease_until=now()+($3::text || ' seconds')::interval, updated_at=now()
      WHERE worker_name=$1 AND lease_owner=$2 AND lease_until>now() RETURNING worker_name`,
      [workerName, owner, String(leaseSeconds)])
      .then((result) => { if (!result.rowCount) leaseFailure = new Error('Worker lease lost during execution'); })
      .catch((error) => { leaseFailure = error instanceof Error ? error : new Error(String(error)); })
      .finally(() => { renewing = false; });
  }, Math.max(1000, Math.floor(leaseSeconds * 1000 / 3)));
  heartbeat.unref();
  try {
    const result = await operation();
    if (leaseFailure) throw leaseFailure;
    const processed = result && typeof result === 'object' && typeof result.processed === 'number' ? result.processed : null;
    await db.query(`UPDATE ops_worker_runs SET status='succeeded',finished_at=now(),duration_ms=$2,processed_count=$3,metadata=metadata||$4::jsonb WHERE id=$1`,
      [runId, Date.now()-started, processed, JSON.stringify({ result: result ?? null })]);
    logger.info({ workerName, runId, durationMs: Date.now()-started, result }, 'Worker completed');
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.query(`UPDATE ops_worker_runs SET status='failed',finished_at=now(),duration_ms=$2,error_message=$3 WHERE id=$1`, [runId, Date.now()-started, message]).catch(()=>undefined);
    logger.error({ err:error, workerName, runId }, 'Worker failed');
    await postAlert(env, { service:'electroobuddy-api', type:'worker_failure', workerName, runId, error:message, timestamp:new Date().toISOString() }).catch((alertError)=>logger.error({err:alertError},'Ops alert delivery failed'));
    throw error;
  } finally {
    clearInterval(heartbeat);
    await db.query(`DELETE FROM ops_worker_leases WHERE worker_name=$1 AND lease_owner=$2`, [workerName, owner]).catch(()=>undefined);
  }
}
