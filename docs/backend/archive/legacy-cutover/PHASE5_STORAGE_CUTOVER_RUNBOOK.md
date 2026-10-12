# Phase 5 Storage Cutover Runbook

1. Create/configure an S3-compatible public image bucket.
2. Set server `STORAGE_ENABLED=true` and all `STORAGE_*` variables.
3. Run `npm run db:migrate` so `004_object_storage_media.sql` is applied.
4. Configure temporary `SOURCE_DATABASE_URL` and `MEDIA_MIGRATION_ALLOWED_HOSTS` (for example the exact Supabase storage hostname).
5. Run `npm run media:migrate-images` and review the dry-run counts.
6. Run `npm run media:migrate-images -- --apply` against staging Neon.
7. Run `npm run media:verify`.
8. Load product, offer, project and team pages and verify images and cache behavior.
9. Keep `VITE_STORAGE_BACKEND=supabase` while the frontend still uses Supabase Auth.
10. After native admin auth is cut over, set staging `VITE_STORAGE_BACKEND=express`, upload test images, verify admin role enforcement, MIME rejection, size rejection and throttling.
11. Only after staging success set production upload mode to `express`.
12. Keep the old Supabase bucket intact for a defined rollback window; do not delete source objects during Phase 5.

Rollback: set `VITE_STORAGE_BACKEND=supabase` for uploads and restore catalog URLs from `media_assets.legacy_url` if a target media rollback is required.
