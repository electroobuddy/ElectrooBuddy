-- Phase 14: native Razorpay refund + cancellation financial authority.
-- Portable PostgreSQL only. Refund provider calls remain in application services.

CREATE TABLE IF NOT EXISTS refund_events (
  id bigserial PRIMARY KEY,
  refund_id uuid REFERENCES order_refunds(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'razorpay',
  event_type text NOT NULL,
  provider_event_id text,
  provider_refund_id text,
  provider_payment_id text,
  payload_sha256 text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','ignored','failed')),
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_events_provider_event
  ON refund_events(provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_refund_events_payload
  ON refund_events(provider, payload_sha256)
  WHERE provider_event_id IS NULL AND payload_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_refund_events_refund ON refund_events(refund_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_refunds_reconcile ON order_refunds(status, updated_at)
  WHERE status IN ('requested','provider_pending');
CREATE INDEX IF NOT EXISTS idx_order_refunds_provider_id ON order_refunds(razorpay_refund_id)
  WHERE razorpay_refund_id IS NOT NULL;

ALTER TABLE order_refunds ADD COLUMN IF NOT EXISTS provider_reconciled_at timestamptz;
ALTER TABLE order_refunds ADD COLUMN IF NOT EXISTS provider_attempted_at timestamptz;
