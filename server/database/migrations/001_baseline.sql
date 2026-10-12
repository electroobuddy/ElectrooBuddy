-- ElectrooBuddy portable PostgreSQL baseline
-- Derived from the pre-native production schema snapshot as of 2026-10-02.
-- Purpose: Express/Neon first, standard PostgreSQL compatible, future PHP/PDO compatible.
-- Intentionally excludes provider-specific auth schemas, RLS policies, storage objects and edge-function coupling.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- --------------------------------------------------------------------------
-- Identity. Legacy authentication user UUIDs are preserved in users.id during cutover.
-- Password material is intentionally nullable until Phase 3 auth migration.
-- --------------------------------------------------------------------------
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  password_hash text,
  email_verified_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','pending_verification')),
  auth_source text NOT NULL DEFAULT 'native' CHECK (auth_source IN ('legacy','native')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE UNIQUE INDEX uq_users_email_ci ON users (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin','user','technician')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_profiles_email_ci ON profiles(lower(email)) WHERE email IS NOT NULL;

-- --------------------------------------------------------------------------
-- Catalog / public content
-- --------------------------------------------------------------------------
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Zap',
  image_url text,
  whatsapp_enabled boolean NOT NULL DEFAULT true,
  call_enabled boolean NOT NULL DEFAULT true,
  book_now_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  service_charge numeric(12,2),
  show_visit_charge boolean NOT NULL DEFAULT false,
  visit_charge_label text DEFAULT 'Visit Charge',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (service_charge IS NULL OR service_charge >= 0)
);

CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text,
  photo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  text text NOT NULL,
  service text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  service text,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES product_categories(id) ON DELETE CASCADE,
  image_url text,
  banner_image_url text,
  icon_name text DEFAULT 'Package',
  sort_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  meta_title text,
  meta_description text,
  commission_rate numeric(5,2) DEFAULT 0 CHECK (commission_rate >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  short_description text,
  sku text UNIQUE,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(12,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  cost_per_item numeric(12,2) CHECK (cost_per_item IS NULL OR cost_per_item >= 0),
  inventory_quantity integer NOT NULL DEFAULT 0 CHECK (inventory_quantity >= 0),
  track_inventory boolean NOT NULL DEFAULT true,
  allow_backorder boolean NOT NULL DEFAULT false,
  installation_available boolean NOT NULL DEFAULT false,
  installation_charge numeric(12,2) NOT NULL DEFAULT 0 CHECK (installation_charge >= 0),
  installation_description text,
  main_image_url text,
  gallery_images text[],
  category text,
  subcategory text,
  brand text,
  tags text[],
  specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  weight numeric(12,3) CHECK (weight IS NULL OR weight >= 0),
  weight_unit text DEFAULT 'kg',
  length numeric(12,3) CHECK (length IS NULL OR length >= 0),
  width numeric(12,3) CHECK (width IS NULL OR width >= 0),
  height numeric(12,3) CHECK (height IS NULL OR height >= 0),
  dimension_unit text DEFAULT 'cm',
  meta_title text,
  meta_description text,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_bestseller boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- Technician and subscription prerequisites
-- --------------------------------------------------------------------------
CREATE TABLE technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  address text,
  skills text[] NOT NULL DEFAULT '{}',
  experience integer NOT NULL DEFAULT 0 CHECK (experience >= 0),
  daily_limit integer NOT NULL DEFAULT 5 CHECK (daily_limit >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','busy','offline')),
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  priority integer NOT NULL DEFAULT 1,
  profile_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'INR',
  duration_days integer NOT NULL DEFAULT 365 CHECK (duration_days > 0),
  description text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_service_calls integer NOT NULL DEFAULT 0 CHECK (max_service_calls >= 0),
  parts_discount_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (parts_discount_percent BETWEEN 0 AND 100),
  has_priority_support boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscription_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  request_id uuid,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  duration_days integer NOT NULL DEFAULT 365 CHECK (duration_days > 0),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed','cancelled')),
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  razorpay_signature text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_subscription_orders_user_request ON subscription_orders(user_id, request_id) WHERE request_id IS NOT NULL;

CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  subscription_order_id uuid REFERENCES subscription_orders(id) ON DELETE SET NULL,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','cancelled','expired')),
  payment_id text UNIQUE,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- --------------------------------------------------------------------------
-- Bookings
-- --------------------------------------------------------------------------
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  booking_request_id uuid,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  exact_location text,
  service_type text NOT NULL,
  custom_service_demand text,
  preferred_date date NOT NULL,
  preferred_time time NOT NULL,
  description text,
  has_old_fan text,
  is_electricity_supply_on text,
  is_switch_working text,
  status text NOT NULL DEFAULT 'pending',
  assigned_technician_id uuid REFERENCES technicians(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  assignment_date date,
  technician_name text,
  technician_phone text,
  user_subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  subscription_discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (subscription_discount >= 0),
  subscription_benefit_used text,
  coupon_code text,
  offer_id uuid,
  offer_applied boolean NOT NULL DEFAULT false,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  original_amount numeric(12,2) CHECK (original_amount IS NULL OR original_amount >= 0),
  final_amount numeric(12,2) CHECK (final_amount IS NULL OR final_amount >= 0),
  original_charge numeric(12,2) CHECK (original_charge IS NULL OR original_charge >= 0),
  final_charge numeric(12,2) CHECK (final_charge IS NULL OR final_charge >= 0),
  tracking_token_hash text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_bookings_user_request ON bookings(user_id, booking_request_id) WHERE user_id IS NOT NULL AND booking_request_id IS NOT NULL;
CREATE UNIQUE INDEX uq_bookings_tracking_token_hash ON bookings(tracking_token_hash) WHERE tracking_token_hash IS NOT NULL;

CREATE TABLE booking_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_email text,
  old_status text,
  new_status text NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscription_benefits_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_subscription_id uuid NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  benefit_type text NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  description text,
  used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_benefit_usage_booking_type ON subscription_benefits_usage(booking_id, benefit_type) WHERE booking_id IS NOT NULL;

-- --------------------------------------------------------------------------
-- Offers, coupons, tax and shipping
-- --------------------------------------------------------------------------
CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed','free_shipping')),
  discount_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  min_order_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_order_value >= 0),
  max_discount_amount numeric(12,2) CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit >= 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  usage_limit_per_user integer CHECK (usage_limit_per_user IS NULL OR usage_limit_per_user >= 0),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  applicable_categories uuid[] NOT NULL DEFAULT '{}',
  applicable_products uuid[] NOT NULL DEFAULT '{}',
  excluded_products uuid[] NOT NULL DEFAULT '{}',
  applicable_to_all boolean NOT NULL DEFAULT false,
  applicable_to_new_users_only boolean NOT NULL DEFAULT false,
  minimum_cart_items integer NOT NULL DEFAULT 1 CHECK (minimum_cart_items > 0),
  is_active boolean NOT NULL DEFAULT true,
  auto_apply boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

CREATE TABLE shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  states text[] NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  min_order_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_order_value >= 0),
  max_order_value numeric(12,2),
  min_weight numeric(12,3) NOT NULL DEFAULT 0 CHECK (min_weight >= 0),
  max_weight numeric(12,3),
  base_charge numeric(12,2) NOT NULL DEFAULT 0 CHECK (base_charge >= 0),
  per_kg_charge numeric(12,2) NOT NULL DEFAULT 0 CHECK (per_kg_charge >= 0),
  free_shipping_threshold numeric(12,2),
  estimated_days_min integer,
  estimated_days_max integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (max_order_value IS NULL OR max_order_value >= min_order_value),
  CHECK (max_weight IS NULL OR max_weight >= min_weight)
);

CREATE TABLE tax_slabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rate numeric(5,2) NOT NULL CHECK (rate BETWEEN 0 AND 100),
  description text,
  applicable_categories uuid[] NOT NULL DEFAULT '{}',
  applicable_to_all boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  banner_url text,
  type text NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage','flat','bogo','shipping','custom')),
  value numeric(12,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  min_purchase numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_purchase >= 0),
  max_discount numeric(12,2) CHECK (max_discount IS NULL OR max_discount >= 0),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  expires_at timestamptz,
  priority integer NOT NULL DEFAULT 0,
  visibility text[] NOT NULL DEFAULT '{home_hero}',
  cta_text text DEFAULT 'Grab Offer',
  cta_link text DEFAULT '/#request-service',
  bg_gradient text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','scheduled','expired')),
  is_active boolean NOT NULL DEFAULT true,
  coupon_code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL;

CREATE TABLE offer_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(offer_id, service_id)
);

CREATE TABLE offer_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(offer_id, product_id)
);

-- --------------------------------------------------------------------------
-- Cart and commerce
-- --------------------------------------------------------------------------
CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_id text,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  installation_service boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);
CREATE UNIQUE INDEX uq_cart_user_product_install ON cart_items(user_id, product_id, installation_service) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uq_cart_session_product_install ON cart_items(session_id, product_id, installation_service) WHERE session_id IS NOT NULL;

CREATE TABLE shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  landmark text,
  address_type text DEFAULT 'home',
  is_default boolean NOT NULL DEFAULT false,
  shiprocket_address_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_shipping_address_default_per_user ON shipping_addresses(user_id) WHERE is_default;

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  checkout_request_id uuid,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending',
  fulfillment_status text NOT NULL DEFAULT 'unfulfilled',
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping_charge numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_charge >= 0),
  installation_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (installation_total >= 0),
  tax_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_code text,
  coupon_discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (coupon_discount >= 0),
  coupon_reserved_at timestamptz,
  coupon_consumed_at timestamptz,
  quote_expires_at timestamptz,
  shipping_zone_id uuid REFERENCES shipping_zones(id) ON DELETE SET NULL,
  tax_rate numeric(5,2) NOT NULL DEFAULT 18 CHECK (tax_rate BETWEEN 0 AND 100),
  cgst_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (cgst_amount >= 0),
  sgst_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (sgst_amount >= 0),
  igst_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (igst_amount >= 0),
  payment_method text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  shipping_address_id uuid REFERENCES shipping_addresses(id) ON DELETE SET NULL,
  shipping_address_data jsonb,
  shiprocket_order_id text,
  shiprocket_shipment_id text,
  tracking_number text,
  courier_name text,
  tracking_url text,
  tracking_history jsonb,
  estimated_delivery_date timestamptz,
  shipping_carrier text,
  shipping_weight numeric(12,3),
  shipping_dimensions jsonb,
  tracking_token_hash text,
  inventory_reserved_at timestamptz,
  inventory_released_at timestamptz,
  refunded_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),
  refund_status text NOT NULL DEFAULT 'none',
  refunded_at timestamptz,
  customer_notes text,
  admin_notes text,
  ordered_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (refunded_amount <= total_amount)
);
CREATE UNIQUE INDEX uq_orders_user_checkout_request ON orders(user_id, checkout_request_id) WHERE checkout_request_id IS NOT NULL;
CREATE UNIQUE INDEX uq_orders_tracking_token_hash ON orders(tracking_token_hash) WHERE tracking_token_hash IS NOT NULL;
CREATE UNIQUE INDEX uq_orders_razorpay_order_id ON orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX uq_orders_razorpay_payment_id ON orders(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  product_sku text,
  product_image text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  installation_service boolean NOT NULL DEFAULT false,
  installation_charge numeric(12,2) NOT NULL DEFAULT 0 CHECK (installation_charge >= 0),
  total_price numeric(12,2) NOT NULL CHECK (total_price >= 0),
  fulfillment_status text NOT NULL DEFAULT 'unfulfilled',
  tracking_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  comment text,
  images text[],
  is_verified_purchase boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  helpful_count integer NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id, order_id)
);

CREATE TABLE wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- --------------------------------------------------------------------------
-- Fulfillment, refunds and returns
-- --------------------------------------------------------------------------
CREATE TABLE fulfillment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'shiprocket',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','retry','succeeded','failed','cancelled')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  last_error text,
  provider_order_id text,
  provider_shipment_id text,
  awb_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(order_id, provider)
);

CREATE TABLE fulfillment_events (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'shiprocket',
  event_key text NOT NULL,
  provider_status text,
  payload jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_fulfillment_event_key UNIQUE(provider, event_key)
);

CREATE TABLE order_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  request_key uuid NOT NULL,
  refund_type text NOT NULL CHECK (refund_type IN ('full','partial')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  reason text,
  status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','provider_pending','processed','failed','cancelled')),
  razorpay_refund_id text UNIQUE,
  provider_status text,
  requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  failed_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, request_key)
);
CREATE UNIQUE INDEX uq_active_full_refund_per_order ON order_refunds(order_id) WHERE refund_type='full' AND status IN ('requested','provider_pending','processed');

CREATE TABLE order_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  request_key uuid NOT NULL,
  return_type text NOT NULL CHECK (return_type IN ('return','replacement','rto')),
  status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','approved','pickup_pending','in_transit','received','inspected','accepted','rejected','refund_pending','refunded','replacement_pending','replaced','rto_in_transit','rto_received','cancelled')),
  reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  received_at timestamptz,
  inspected_at timestamptz,
  completed_at timestamptz,
  provider_return_id text,
  provider_status text,
  inspection_notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, request_key)
);

CREATE TABLE order_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES order_returns(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  resolution text NOT NULL CHECK (resolution IN ('refund','replacement')),
  accepted_quantity integer NOT NULL DEFAULT 0 CHECK (accepted_quantity >= 0),
  restocked_quantity integer NOT NULL DEFAULT 0 CHECK (restocked_quantity >= 0),
  unit_refund_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (unit_refund_amount >= 0),
  UNIQUE(return_id, order_item_id),
  CHECK (accepted_quantity <= quantity),
  CHECK (restocked_quantity <= accepted_quantity)
);

CREATE TABLE return_events (
  id bigserial PRIMARY KEY,
  return_id uuid NOT NULL REFERENCES order_returns(id) ON DELETE CASCADE,
  event_key text NOT NULL UNIQUE,
  status text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- Notifications / operations
-- --------------------------------------------------------------------------
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  in_app_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  push_booking_created boolean NOT NULL DEFAULT true,
  push_booking_confirmed boolean NOT NULL DEFAULT true,
  push_booking_assigned boolean NOT NULL DEFAULT true,
  push_booking_completed boolean NOT NULL DEFAULT true,
  push_booking_cancelled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  endpoint text,
  subscription jsonb,
  fcm_token text,
  subscription_type text NOT NULL DEFAULT 'fcm' CHECK (subscription_type IN ('fcm','vapid')),
  p256dh text,
  auth text,
  browser text,
  browser_name text,
  device_type text,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  failure_count integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (fcm_token IS NOT NULL OR endpoint IS NOT NULL)
);
CREATE UNIQUE INDEX uq_push_endpoint ON push_subscriptions(endpoint) WHERE endpoint IS NOT NULL;
CREATE UNIQUE INDEX uq_push_fcm_token ON push_subscriptions(fcm_token) WHERE fcm_token IS NOT NULL;

CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES notifications(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action varchar(50) NOT NULL,
  channel varchar(50),
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shipping_settings (
  id bigserial PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  account_email text,
  credential_secret_ref text,
  webhook_url text,
  auto_create_shipment boolean NOT NULL DEFAULT true,
  default_length numeric(12,3),
  default_width numeric(12,3),
  default_height numeric(12,3),
  default_weight numeric(12,3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

CREATE TABLE rate_limit_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ip_address inet,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  first_request timestamptz NOT NULL DEFAULT now(),
  last_request timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public_form_rate_limits (
  id bigserial PRIMARY KEY,
  form_name text NOT NULL,
  fingerprint_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- Operational indexes
-- --------------------------------------------------------------------------
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_services_sort ON services(sort_order);
CREATE INDEX idx_technicians_user_approval ON technicians(user_id, approval_status);
CREATE INDEX idx_technicians_status_priority ON technicians(status, priority DESC);
CREATE INDEX idx_products_active_sort ON products(is_active, sort_order);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_name_search ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_tags ON products USING gin(tags);
CREATE INDEX idx_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_categories_featured ON product_categories(is_featured, sort_order);
CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at DESC);
CREATE INDEX idx_bookings_status_date ON bookings(status, preferred_date);
CREATE INDEX idx_bookings_technician_status ON bookings(assigned_technician_id, status);
CREATE INDEX idx_subscription_orders_user_created ON subscription_orders(user_id, created_at DESC);
CREATE INDEX idx_subscription_orders_status ON subscription_orders(status, created_at DESC);
CREATE INDEX idx_user_subscriptions_user_status ON user_subscriptions(user_id, status, end_date DESC);
CREATE INDEX idx_subscription_benefits_usage_sub ON subscription_benefits_usage(user_subscription_id, benefit_type);
CREATE INDEX idx_coupons_validation ON coupons(code, is_active, valid_from, valid_until);
CREATE INDEX idx_offers_status_priority ON offers(status, is_active, priority DESC);
CREATE INDEX idx_shipping_rates_zone ON shipping_rates(zone_id, is_active);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_session ON cart_items(session_id);
CREATE INDEX idx_shipping_addresses_user ON shipping_addresses(user_id);
CREATE INDEX idx_orders_user_status ON orders(user_id, status, created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status, created_at DESC);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status, created_at DESC);
CREATE INDEX idx_orders_coupon_user ON orders(coupon_code, user_id) WHERE coupon_code IS NOT NULL;
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_reviews_product_approved ON product_reviews(product_id, is_approved, created_at DESC);
CREATE INDEX idx_wishlist_user ON wishlist(user_id, created_at DESC);
CREATE INDEX idx_fulfillment_jobs_work ON fulfillment_jobs(status, next_attempt_at);
CREATE INDEX idx_fulfillment_events_order ON fulfillment_events(order_id, received_at DESC);
CREATE INDEX idx_order_refunds_order ON order_refunds(order_id, created_at DESC);
CREATE INDEX idx_order_refunds_worklist ON order_refunds(status, updated_at);
CREATE INDEX idx_order_returns_order ON order_returns(order_id, created_at DESC);
CREATE INDEX idx_order_returns_worklist ON order_returns(status, updated_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id, created_at DESC);
CREATE INDEX idx_push_subscriptions_user_active ON push_subscriptions(user_id, is_active);
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id, changed_at DESC);
CREATE INDEX idx_rate_limit_lookup ON rate_limit_tracker(user_id, endpoint, last_request DESC);
CREATE INDEX idx_public_form_rate_limit_lookup ON public_form_rate_limits(form_name, fingerprint_hash, created_at DESC);

-- --------------------------------------------------------------------------
-- updated_at triggers
-- --------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','profiles','services','team_members','testimonials','projects','product_categories','products',
    'subscription_plans','subscription_orders','user_subscriptions','bookings','coupons','offers','cart_items',
    'shipping_addresses','orders','product_reviews','fulfillment_jobs','order_refunds','order_returns',
    'notifications','notification_preferences','push_subscriptions','site_settings','shipping_settings'
  ] LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', 'trg_' || t || '_updated_at', t);
  END LOOP;
END $$;

COMMIT;
