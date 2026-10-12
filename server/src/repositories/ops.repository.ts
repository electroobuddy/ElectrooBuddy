import type { DatabaseClient } from '../config/database.js';

export class OpsRepository {
  constructor(private readonly database: DatabaseClient) {}
  async snapshot(staleMinutes: number) {
    const [workers, failed, leases] = await Promise.all([
      this.database.query(`SELECT DISTINCT ON (worker_name) worker_name,status,started_at,finished_at,duration_ms,processed_count,error_message FROM ops_worker_runs ORDER BY worker_name,started_at DESC`),
      this.database.query(`SELECT worker_name,status,started_at,finished_at,error_message FROM ops_worker_runs WHERE status='failed' AND started_at > now()-interval '24 hours' ORDER BY started_at DESC LIMIT 50`),
      this.database.query(`SELECT worker_name,lease_owner,lease_until FROM ops_worker_leases WHERE lease_until > now() ORDER BY worker_name`)
    ]);
    const stale = workers.rows.filter((row:any)=>{
      const t = new Date(row.finished_at ?? row.started_at).getTime();
      return Number.isFinite(t) && Date.now()-t > staleMinutes*60_000;
    }).map((row:any)=>row.worker_name);
    return { workers: workers.rows, failures24h: failed.rows, activeLeases: leases.rows, staleWorkers: stale };
  }
}
