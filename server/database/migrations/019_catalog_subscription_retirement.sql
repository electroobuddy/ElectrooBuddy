-- Phase 20: native catalog/admin CRUD + subscription authority retirement
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active_price ON subscription_plans(is_active,price);
CREATE INDEX IF NOT EXISTS idx_subscription_orders_provider_order ON subscription_orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_admin_worklist ON user_subscriptions(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_services_offer ON offer_services(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_products_offer ON offer_products(offer_id);
