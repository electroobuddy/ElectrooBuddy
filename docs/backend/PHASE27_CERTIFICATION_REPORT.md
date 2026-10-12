# Phase 27 Certification Report

## Result

**STATIC CUTOVER READINESS: PASS**

Phase 27 converts the production frontend/API boundary to a same-origin Vercel proxy and adds deployment fail-fast checks and live cutover certification tooling.

## Implemented

- Added Vercel function `api/v1/[...path].ts`.
  - Requires server-side `API_ORIGIN`.
  - Requires HTTPS in production.
  - Does not forward hop-by-hop/Host headers.
  - Preserves refresh `Set-Cookie` headers.
  - Limits proxied request bodies to 12 MB.
- Frontend API base defaults to `/api/v1`.
- Vercel SPA rewrite excludes `/api`.
- Vercel install changed from `npm install` to deterministic `npm ci`.
- CSP keeps API calls same-origin instead of requiring an external API hostname.
- Added missing `VITE_SHIPPING_BACKEND=express` deployment contract.
- Added production API environment fail-fast validation:
  - HTTPS/non-local `PUBLIC_APP_URL` and `PUBLIC_API_URL`.
  - `DB_SSL=true`.
  - `TRUST_PROXY>=1`.
  - placeholder JWT rejection.
  - HTTPS/non-local production CORS origins.
- Added static cutover audit and live deployment smoke certification.
- Added operational cutover/rollback runbook.

## Regression status

- Phase 22: PASS
- Phase 23: PASS
- Phase 24: PASS
- Phase 25: PASS (one existing server-lock warning)
- Phase 26: PASS (one existing server-lock warning)
- Phase 27: PASS — 25/25 checks

## Live certification blockers in this execution environment

The package does not contain real production values for:

- `PHASE27_FRONTEND_URL`
- `PHASE27_API_ORIGIN`
- Neon/provider production secrets

Therefore the live deployed traffic cutover is intentionally **not** claimed as PASS here.

`server/package-lock.json` is also still absent, so deterministic `npm --prefix server ci` remains an unresolved production reproducibility item. Do not fabricate the lockfile; generate it with npm registry access and commit it.

## Live cutover command

```powershell
$env:PHASE27_FRONTEND_URL='https://www.example.com'
$env:PHASE27_API_ORIGIN='https://api.example.com'
powershell -ExecutionPolicy Bypass -File .\tool\phase27_cutover_certify.ps1
```

The live gate verifies direct API health/readiness, proxied API health/readiness, the Vercel proxy marker, and SPA deep-link routing.
