BEGIN;

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_created
  ON shipping_addresses(user_id, created_at DESC);

ALTER TABLE shipping_addresses
  DROP CONSTRAINT IF EXISTS shipping_addresses_address_type_check;
ALTER TABLE shipping_addresses
  ADD CONSTRAINT shipping_addresses_address_type_check CHECK (address_type IS NULL OR address_type IN ('home','work','other'));

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

COMMIT;
