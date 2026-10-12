# FAPI-13 — Migration Residue & Legacy Backend Flag Cleanup

## Result
The active application now documents and configures a single permanent backend architecture: Express + PostgreSQL/Neon.

## Changes
- Removed all `VITE_*_BACKEND` variables from `.env.example`.
- Updated Phase 27 cutover audit to require absence of legacy backend flags.
- Removed stale Supabase placeholder code/comments from the active sitemap generator.
- Rewrote active root/server README and project reference for the current architecture.
- Archived Phase 0–21 cutover documentation and old Supabase dependency maps under `docs/backend/archive/legacy-cutover/`.
- Archived old Supabase push/OneSignal setup guides under `docs/archive/legacy-supabase-guides/`.
- Preserved historical audit tooling under existing archive paths.

## Permanent runtime contract
Frontend -> Express `/api/v1` -> PostgreSQL/Neon. No backend-selection feature flag is supported.
