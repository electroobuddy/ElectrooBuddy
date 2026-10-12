BEGIN;

CREATE TABLE IF NOT EXISTS public.ops_worker_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('running','succeeded','failed','skipped')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,
  processed_count integer,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_ops_worker_runs_worker_started ON public.ops_worker_runs(worker_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_worker_runs_status_started ON public.ops_worker_runs(status, started_at DESC);

CREATE TABLE IF NOT EXISTS public.ops_worker_leases (
  worker_name text PRIMARY KEY,
  lease_owner text NOT NULL,
  lease_until timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ops_worker_leases_until ON public.ops_worker_leases(lease_until);

COMMIT;
