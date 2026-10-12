-- Phase 24: final provider runtime shutdown.
-- Normalize historical auth provenance without changing user UUIDs or login eligibility.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_source_check;

UPDATE users
SET auth_source = 'legacy'
WHERE auth_source NOT IN ('legacy', 'native');

ALTER TABLE users
  ALTER COLUMN auth_source SET DEFAULT 'native';

ALTER TABLE users
  ADD CONSTRAINT users_auth_source_check
  CHECK (auth_source IN ('legacy', 'native'));
