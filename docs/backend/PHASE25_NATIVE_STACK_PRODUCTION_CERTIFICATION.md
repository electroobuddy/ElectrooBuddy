# Phase 25 — Native Stack Production Certification & Dead-Code Cleanup

## Scope
Phase 25 certifies the post-Supabase architecture as an Express/PostgreSQL-first production stack and removes obsolete executable migration tooling.

## Changes
- Retired active Phase 0–21 audit commands that required deleted Supabase-era rollback artifacts.
- Archived historical audit scripts under `docs/backend/archive/audit-tooling/` for traceability without keeping them in the executable tool surface.
- Removed the stale Supabase auth export example and freeze contract from deployable/current contracts.
- Added configurable rate limiting to public order and booking tracking lookup endpoints.
- Added explicit `admin:write` authorization to admin media upload/delete routes.
- Added `audit:backend-phase25` and `certify:production` commands.
- Preserved Phases 22–24 as regression gates for the runtime shutdown.

## Certification commands
```powershell
npm run audit:backend-phase22
npm run audit:backend-phase23
npm run audit:backend-phase24
npm run audit:backend-phase25
npm run certify:production
```

`certify:production` requires dependencies to be installed and runs frontend lint/tests/build plus the server verification suite.

## Dependency-lock note
The root application has a canonical `package-lock.json`. The server package must also have its own lockfile before CI uses `npm --prefix server ci`; generate and commit it with npm when registry access is available.
