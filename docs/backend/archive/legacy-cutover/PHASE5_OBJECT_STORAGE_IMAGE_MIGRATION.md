# Phase 5 — Object Storage + Image Migration

## Goal
Remove storage-provider knowledge from application code, migrate catalog media from Supabase Storage to S3-compatible object storage, and retain a safe rollback path while the frontend authentication cutover remains deferred.

## Architecture

`Admin UI -> storageApi -> /api/v1/admin/media/images -> MediaService -> StorageProvider -> S3-compatible object storage`

The concrete provider is configured with `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, credentials, and `STORAGE_PUBLIC_BASE_URL`. No catalog or admin domain code imports an S3/Neon SDK directly.

## Providers
The `StorageProvider` contract supports put/delete/head/public URL operations. Phase 5 implements `S3CompatibleStorageProvider`, which can target Neon Object Storage, AWS S3, Cloudflare R2, MinIO or another compatible endpoint. A disabled provider allows API health/read routes to boot before object storage is configured.

## Upload security
- Native API authentication is mandatory for Express uploads.
- Admin role is mandatory.
- Dedicated upload rate limiting applies before multipart parsing.
- Files are memory-only and limited by `STORAGE_MAX_IMAGE_BYTES`.
- Browser MIME is not trusted: `file-type` checks magic bytes.
- Allowed content is JPEG, PNG, WebP and GIF only.
- Claimed MIME must match detected MIME.
- Object names are UUID-based; user filenames never become object keys.
- SHA-256 is recorded for integrity/deduplication investigations.
- If DB metadata insertion fails after object upload, the object is deleted best-effort to avoid orphans.

## Frontend rollout
All admin upload components call `src/lib/storageApi.ts`. With `VITE_STORAGE_BACKEND=supabase`, the compatibility adapter uses the existing Supabase bucket. With `express`, the adapter calls the protected API and expects the Phase 3 native access token. Do not enable Express uploads in production until native frontend auth is cut over and validated.

## Media metadata
`004_object_storage_media.sql` adds `media_assets`, storing provider, bucket, object key, public URL, original legacy URL, MIME, size, SHA-256, original filename and uploader UUID. Existing catalog columns continue to carry public URLs for backwards compatibility.

## Migration safety
`npm run media:migrate-images` is dry-run by default. `--apply` downloads only from explicit `MEDIA_MIGRATION_ALLOWED_HOSTS`, enforces download timeout/size limits, validates content magic bytes, uploads through `StorageProvider`, records `legacy_url`, and updates only the target PostgreSQL/Neon database.

The source Supabase database and bucket are not mutated.

## Verification
`npm run media:verify` confirms required product/offer/project/team URLs use the target public base URL and HEAD-checks migrated objects recorded in `media_assets`.
