BEGIN;
CREATE INDEX IF NOT EXISTS idx_shipping_zones_state_lookup ON shipping_zones USING gin(states) WHERE is_active=true;
CREATE INDEX IF NOT EXISTS idx_shipping_rates_quote_lookup ON shipping_rates(zone_id,min_order_value,min_weight) WHERE is_active=true;
CREATE INDEX IF NOT EXISTS idx_tax_slabs_quote_active ON tax_slabs(applicable_to_all,created_at) WHERE is_active=true;
CREATE INDEX IF NOT EXISTS idx_orders_coupon_user_usage ON orders(user_id,coupon_code) WHERE status <> 'cancelled' AND deleted_at IS NULL;
COMMENT ON TABLE coupons IS 'Coupon definitions. Phase 10 pricing APIs validate/preview only; consumption remains checkout authority.';
COMMIT;
