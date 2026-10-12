BEGIN;
CREATE INDEX IF NOT EXISTS idx_orders_user_ordered_active ON orders(user_id,ordered_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_admin_ordered_active ON orders(ordered_at DESC) WHERE deleted_at IS NULL AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order_created ON order_items(order_id,created_at);
CREATE INDEX IF NOT EXISTS idx_fulfillment_jobs_order_created ON fulfillment_jobs(order_id,created_at DESC);
COMMIT;
