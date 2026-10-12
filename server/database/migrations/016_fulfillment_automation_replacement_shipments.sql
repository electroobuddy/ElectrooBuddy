-- Phase 17: fulfillment automation, retry/dead-letter operations, and replacement outbound shipments.
ALTER TABLE fulfillment_jobs ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20);
ALTER TABLE fulfillment_jobs ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;
ALTER TABLE fulfillment_jobs ADD COLUMN IF NOT EXISTS dead_lettered_at timestamptz;
ALTER TABLE fulfillment_jobs ADD COLUMN IF NOT EXISTS label_url text;
ALTER TABLE fulfillment_jobs ADD COLUMN IF NOT EXISTS manifest_url text;
ALTER TABLE fulfillment_jobs ADD COLUMN IF NOT EXISTS invoice_url text;

CREATE INDEX IF NOT EXISTS idx_fulfillment_jobs_ready_v17 ON fulfillment_jobs(status, next_attempt_at, created_at)
  WHERE status IN ('queued','retry');
CREATE INDEX IF NOT EXISTS idx_fulfillment_jobs_dead_letter_v17 ON fulfillment_jobs(dead_lettered_at DESC)
  WHERE dead_lettered_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS replacement_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL UNIQUE REFERENCES order_returns(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'shiprocket',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','retry','succeeded','failed','cancelled')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  last_attempt_at timestamptz,
  dead_lettered_at timestamptz,
  last_error text,
  provider_order_id text,
  provider_shipment_id text,
  awb_code text,
  courier_name text,
  tracking_url text,
  label_url text,
  manifest_url text,
  pickup_scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_replacement_shipments_ready_v17 ON replacement_shipments(status,next_attempt_at,created_at)
  WHERE status IN ('queued','retry');
CREATE INDEX IF NOT EXISTS idx_replacement_shipments_order_v17 ON replacement_shipments(order_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replacement_shipments_dead_letter_v17 ON replacement_shipments(dead_lettered_at DESC)
  WHERE dead_lettered_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS fulfillment_operation_events (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('order','replacement')),
  entity_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fulfillment_operation_events_entity_v17 ON fulfillment_operation_events(entity_type,entity_id,created_at DESC);
