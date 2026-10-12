-- Phase 15: native returns / RTO / post-shipment financial authority.
-- The baseline already owns order_returns/order_return_items/return_events.
ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS resolution_refund_id uuid REFERENCES order_refunds(id) ON DELETE SET NULL;
ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS replacement_authorized_at timestamptz;
ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS restock_completed_at timestamptz;
ALTER TABLE order_returns ADD COLUMN IF NOT EXISTS last_error text;

CREATE INDEX IF NOT EXISTS idx_order_returns_user_requested ON order_returns(user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_returns_worklist ON order_returns(status, requested_at) WHERE status NOT IN ('refunded','replaced','rejected','cancelled');
CREATE INDEX IF NOT EXISTS idx_order_returns_order ON order_returns(order_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_return_items_product ON order_return_items(product_id, return_id);
CREATE INDEX IF NOT EXISTS idx_return_events_return_created ON return_events(return_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_returns_provider_return_id ON order_returns(provider_return_id) WHERE provider_return_id IS NOT NULL;
