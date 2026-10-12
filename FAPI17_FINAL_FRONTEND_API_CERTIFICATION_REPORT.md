# FAPI-17 — Final Frontend API Production Certification

## Scope

Final certification of the React frontend after FAPI-1 through FAPI-16 against the native Express/PostgreSQL API architecture.

## Completed certification work

- Audited frontend API usage against the Express route inventory.
- Checked 137 frontend `nativeApiFetch` call sites against 153 server routes.
- Result: **0 unmatched frontend API calls**.
- Confirmed zero runtime Supabase imports/calls.
- Confirmed zero migration-era `VITE_*_BACKEND` switches.
- Removed the last production dummy counter dataset/component.
- Removed retired static fallback files:
  - `src/data/services.ts`
  - `src/data/team.ts`
  - `src/data/projects.ts`
  - `src/data/testimonials.ts`
- Added query-backed `useSiteSettings()`.
- Migrated secondary customer contact/receipt surfaces to API-backed site settings:
  - Privacy
  - Terms
  - Order Success
  - Booking Form
  - Service Card
  - User Order invoice
  - Booking invoice
- Confirmed TanStack Query remains the single server-state cache authority.
- Confirmed auth boundaries clear private query cache.
- Confirmed the FAPI-16 integration suite remains present: 6 suites / 21 tests.

## Certification results

- FAPI-1 through FAPI-16 regression audits: **PASS**
- FAPI-17 final audit: **12/12 PASS**
- Phase 24 zero-Supabase production audit: **PASS**
- Phase 29 launch-readiness audit: **43/43 PASS**
- Modified TypeScript/TSX transpile validation: **9/9 PASS**

## New commands

```bash
npm run audit:fapi17
npm run certify:fapi17
```

`certify:fapi17` performs the final static audit, FAPI-16 integration tests, lint, production build, and the Phase 24/29 production architecture gates.

## Runtime verification boundary

A real `npm ci` was attempted in the execution environment, but npm registry access timed out before `vite` or `vitest` was installed. Therefore this report does **not** claim that the dependency-linked integration tests or production Vite build executed here.

Required final local/CI command:

```bash
npm ci
npm run certify:fapi17
```

The inherited `server/package-lock.json` issue also remains a separate backend CI blocker until it is generated and committed with working npm registry access.

## Frontend release decision

**STATIC FRONTEND API CERTIFICATION: PASS**

**FINAL DEPLOYMENT GO/NO-GO: PENDING executable `npm ci && npm run certify:fapi17` evidence.**
