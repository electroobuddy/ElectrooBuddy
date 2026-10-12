-- Phase 21: native booking financial authority.
-- Coupon and subscription benefits become single-write PostgreSQL authority for service bookings.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS coupon_consumed_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS financial_authority_version integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_bookings_coupon_consumption
  ON bookings(booking_coupon_id, coupon_consumed_at)
  WHERE booking_coupon_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_subscription_financial
  ON bookings(user_subscription_id, subscription_benefit_used, status)
  WHERE user_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_benefit_usage_subscription_type
  ON subscription_benefits_usage(user_subscription_id, benefit_type, used_at DESC);

CREATE TABLE IF NOT EXISTS booking_financial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  user_subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  benefit_type text,
  amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_financial_events_booking ON booking_financial_events(booking_id, created_at DESC);
