BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_provider_status text,
  ADD COLUMN IF NOT EXISTS payment_provider_method text,
  ADD COLUMN IF NOT EXISTS payment_reconciled_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_last_error text;

CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'razorpay',
  event_type text NOT NULL,
  provider_event_id text,
  provider_order_id text,
  provider_payment_id text,
  payload_sha256 text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','ignored','failed')),
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_events_provider_event
  ON payment_events(provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_events_payload_hash
  ON payment_events(provider, payload_sha256)
  WHERE provider_event_id IS NULL AND payload_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_events_order_created ON payment_events(order_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reconcile ON orders(created_at)
  WHERE payment_method='razorpay' AND payment_status='pending' AND razorpay_order_id IS NOT NULL AND deleted_at IS NULL;

COMMIT;
