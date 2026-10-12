BEGIN;

CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_provider text NOT NULL,
  bucket text NOT NULL,
  object_key text NOT NULL,
  public_url text,
  legacy_url text,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','image/gif')),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  sha256 text NOT NULL CHECK (length(sha256) = 64),
  original_filename text,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  migrated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(storage_provider, bucket, object_key)
);

CREATE INDEX idx_media_assets_sha256 ON media_assets(sha256) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_assets_legacy_url ON media_assets(legacy_url) WHERE legacy_url IS NOT NULL;
CREATE INDEX idx_media_assets_uploaded_by ON media_assets(uploaded_by, created_at DESC) WHERE uploaded_by IS NOT NULL;

COMMIT;
