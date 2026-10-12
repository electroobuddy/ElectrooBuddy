BEGIN;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_init_started_at timestamptz;

CREATE TABLE IF NOT EXISTS checkout_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  request_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_events_order_created ON checkout_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_expiry ON orders(quote_expires_at) WHERE payment_status='pending' AND inventory_reserved_at IS NOT NULL AND inventory_released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_coupon_reservation ON orders(coupon_id, quote_expires_at) WHERE coupon_reserved_at IS NOT NULL AND coupon_consumed_at IS NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_pending_razorpay ON orders(created_at) WHERE payment_method='razorpay' AND payment_status='pending' AND deleted_at IS NULL;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_allowed CHECK (payment_method IS NULL OR payment_method IN ('cod','razorpay')) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_payment_method_allowed;

COMMIT;
