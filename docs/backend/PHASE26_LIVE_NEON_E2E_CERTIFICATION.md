# Phase 26 — Live Neon Migration + End-to-End Production Smoke Certification

## Objective
Certify the post-Supabase ElectrooBuddy stack against the real PostgreSQL/Neon schema and the native Express API without placing production credentials in source control.

## Implemented in this phase

### 1. Immutable migration checksum contract
`server/database/contracts/migration-checksums.json` records SHA-256 hashes for migrations `001` through `021`.

The live certifier compares every applied row in `public.schema_migrations` with this manifest. A changed historical migration fails certification instead of silently continuing.

### 2. Live Neon/database certifier
Run:

```powershell
npm run server:phase26:live
```

The certifier performs read-only checks by default:

- PostgreSQL connectivity
- `schema_migrations` existence
- all 21 migration versions present
- database migration checksums match committed source
- critical native tables exist
- `users.auth_source` defaults to `native`
- critical order/booking user references have no orphans
- live users/products/bookings/orders row counts are reported

It does **not** mutate production data by default.

### 3. Native API smoke checks
Set the API root including the API prefix, for example:

```powershell
$env:PHASE26_API_BASE_URL = "https://api.example.com/api/v1"
npm run server:phase26:live
```

The certifier calls:

- `GET /health`
- `GET /ready`
- `GET /products`
- `GET /services`

Each must return a successful HTTP status.

### 4. Mutation safety
Destructive or business-state-changing E2E flows are deliberately disabled against production.

`PHASE26_ALLOW_MUTATIONS=true` is reserved for a dedicated staging/test database using Razorpay test credentials, Shiprocket test/sandbox-safe configuration, disposable accounts/orders, and test notification recipients.

Never enable the mutation flag against the production customer dataset merely to satisfy a deployment gate.

### 5. Static Phase 26 readiness audit
Run:

```powershell
npm run audit:backend-phase26
```

It verifies:

- Phase 25 remains clean
- migration sequence is exactly `001..021`
- migration checksum manifest has no drift
- Phase 26 live harness is present
- native auth/catalog/booking/technician/checkout/payment/order/refund/return/shipping/notification/admin/subscription route domains remain registered
- no runtime `.env` is committed
- no obvious PostgreSQL credentials/private keys are embedded in runtime source
- required production environment contract remains documented

## Full local/live certification sequence

```powershell
# Generate and commit this once if it is still missing.
npm --prefix server install --package-lock-only

npm ci
npm --prefix server ci

npm run audit:backend-phase22
npm run audit:backend-phase23
npm run audit:backend-phase24
npm run audit:backend-phase25
npm run audit:backend-phase26

npm run server:verify
npm run build

npm run db:status
npm run db:migrate
npm run db:status
npm run db:verify

$env:PHASE26_API_BASE_URL = "https://YOUR-API-HOST/api/v1"
npm run server:phase26:live
```

For a new environment, run `db:status` before and after `db:migrate`; after migration all versions must show `APPLIED` and none may show `DRIFT`.

## Current execution result (2026-10-07)

### Passed in the packaged source
- Phase 25 regression gate: **PASS**
- Phase 26 static readiness: **PASS**
- migration sequence `001..021`: **PASS**
- migration checksum manifest: **PASS**
- native route-domain coverage: **PASS**
- source secret hygiene: **PASS**

### External blockers preventing a truthful LIVE PASS in this environment
1. `DATABASE_URL` / `MIGRATION_DATABASE_URL` is not present in the supplied handoff or execution environment.
2. No production API base URL is available to this execution environment.
3. `server/package-lock.json` is still missing.
4. npm registry DNS resolution currently fails (`EAI_AGAIN registry.npmjs.org`), so the missing server lockfile/dependencies cannot be generated here.

Therefore this package is **Phase 26 live-certification ready**, but the real Neon/API result remains **BLOCKED**, not falsely marked as passed.

## Production PASS criteria
Phase 26 becomes fully certified only when all of the following are true:

- dependency installs are deterministic (`package-lock.json` exists for root and server)
- frontend build passes
- server typecheck/tests/build pass
- database migrations `001..021` are applied with zero checksum drift
- `db:verify` passes
- Neon integrity checks pass
- deployed `/health` and `/ready` pass
- deployed public catalog smoke calls pass
- provider-backed mutation tests pass on staging using test/sandbox credentials
- no production credentials or test records are committed to Git
