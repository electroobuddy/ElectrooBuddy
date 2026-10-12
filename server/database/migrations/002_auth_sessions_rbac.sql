-- Phase 3: portable authentication, sessions, RBAC support and security audit events.
-- Remains standard PostgreSQL and is compatible with Neon and future PHP/PDO.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS native_login_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE users
  ADD CONSTRAINT users_failed_login_count_nonnegative CHECK (failed_login_count >= 0);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL UNIQUE,
  token_family_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  rotated_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  replaced_by_session_id uuid REFERENCES auth_sessions(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active
  ON auth_sessions(user_id, expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_auth_sessions_family
  ON auth_sessions(token_family_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  requested_ip inet,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_active
  ON password_reset_tokens(user_id, expires_at)
  WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  requested_ip inet,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS idx_email_verification_user_active
  ON email_verification_tokens(user_id, expires_at)
  WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS security_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success','failure','blocked')),
  request_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_security_audit_user_created
  ON security_audit_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_created
  ON security_audit_events(event_type, created_at DESC);

COMMIT;
