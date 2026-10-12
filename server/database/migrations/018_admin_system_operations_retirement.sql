-- Phase 19: native admin/system operations and public forms retirement
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS request_key uuid;
CREATE UNIQUE INDEX IF NOT EXISTS uq_contact_messages_request_key ON contact_messages(request_key) WHERE request_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_messages_read_created ON contact_messages(read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created ON newsletter_subscribers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_status_created ON users(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(lower(full_name));
