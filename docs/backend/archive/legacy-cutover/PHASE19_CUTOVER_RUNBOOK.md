# Phase 19 Cutover Runbook

1. Apply PostgreSQL migrations through `018_admin_system_operations_retirement.sql`.
2. Ensure the frontend has `VITE_API_BASE_URL=/api/v1` (or the deployed API prefix URL used by the project).
3. Sign in with a native/hybrid admin session and verify Dashboard, Messages, Subscribers and Users.
4. Submit the Contact page twice using the same retry request key and verify one durable message.
5. Submit the same newsletter email twice and verify the second response is `alreadySubscribed` rather than a duplicate row.
6. Verify a non-admin receives 403 from every `/admin/...` Phase 19 endpoint.
7. Run `python tool/phase0_backend_freeze_audit.py --check` and `npm run audit:backend-phase19`.
8. Do not delete Supabase Edge Functions or migrations yet. The retirement gate only permits removal after there are zero certified callers for that dependency.
