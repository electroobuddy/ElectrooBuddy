# Phase 24 — Final Supabase Dependency, Environment & Infrastructure Shutdown

## Result
Production runtime is fully detached from Supabase.

### Removed
- `@supabase/supabase-js` root dependency and package-lock transitive packages.
- Frontend Supabase client/types directory.
- Supabase Edge Function/migration workspace from the deployable source tree.
- Deno/Supabase function configuration and legacy RPC migration entrypoint.
- Supabase CSP websocket/HTTP allowlist and HTML preconnect.
- Supabase Vite vendor chunk.
- Supabase frontend environment variables and fallback backend modes.
- One-time Supabase auth importer.
- Cutover-only catalog/account/cart/booking/technician/pricing sync and parity commands/scripts.
- Stale Bun lockfiles that still encoded the removed dependency; npm/package-lock is canonical.

### Database cutover
Migration `021_final_provider_runtime_shutdown.sql` normalizes historical provider provenance to `legacy`, keeps UUIDs unchanged, and makes `native` the default for all new users. The baseline migration is also native-first for fresh installs.

### Production certification
`npm run audit:backend-phase24` scans production source/configuration and fails if it finds:
- Supabase packages/imports
- Supabase environment variables
- Supabase HTTP/WebSocket endpoints
- provider client construction
- obsolete Supabase/Deno infrastructure

Phase 22, Phase 23, and Phase 24 audits all pass in this handoff.

### Build note
A full `npm ci` dependency installation was attempted in the execution environment but timed out before Vite binaries completed installing. JSON/config integrity and all migration certification gates passed. Run `npm ci && npm run build` and `npm --prefix server ci && npm --prefix server run verify` in the normal development/CI environment for dependency-linked certification.
