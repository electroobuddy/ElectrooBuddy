# Phase 27 — Production Deployment & Operational Cutover

## Architecture

- Vercel hosts the Vite SPA and a narrow same-origin proxy at `/api/v1/*`.
- `API_ORIGIN` is a **server-side Vercel variable** pointing to the separately deployed Express API origin.
- The browser uses `VITE_API_BASE_URL=/api/v1`; it never needs the private API hostname.
- Express owns Neon, Razorpay, Shiprocket, Firebase, SMTP and object-storage secrets.
- `PUBLIC_API_URL` on the API host must point directly to the API host so provider webhooks never traverse the frontend proxy.

## Vercel production variables

Required:

- `API_ORIGIN=https://api.example.com`
- `VITE_API_BASE_URL=/api/v1`
- `VITE_RAZORPAY_KEY_ID=<public Razorpay key>` when checkout is enabled

All `VITE_*_BACKEND` values should remain `express`.

Never place `DATABASE_URL`, JWT secrets, Razorpay secret, Shiprocket credentials, Firebase private key, SMTP password or storage secret in Vercel frontend variables.

## API-host production variables

At minimum configure:

- `NODE_ENV=production`
- `DATABASE_URL` and `MIGRATION_DATABASE_URL`
- `CORS_ORIGINS=https://your-frontend-domain`
- `PUBLIC_APP_URL=https://your-frontend-domain`
- `PUBLIC_API_URL=https://your-api-domain`
- strong `JWT_ACCESS_SECRET`
- SMTP credentials with `AUTH_DELIVERY_MODE=smtp`
- provider secrets for each enabled integration

Keep `AUTH_REFRESH_COOKIE_DOMAIN` empty with the Phase 27 proxy. The proxy makes the browser cookie first-party on the frontend domain.

## Cutover order

1. Back up/branch the Neon database and run Phase 26 migration certification.
2. Deploy the API host first; verify `/api/v1/health` and `/api/v1/ready` directly.
3. Configure `API_ORIGIN` in Vercel and deploy the frontend.
4. Verify `/api/v1/health` through the frontend URL and confirm `x-electroobuddy-proxy: vercel`.
5. Verify login → refresh → logout, catalog, booking, checkout test mode, admin and notification flows.
6. Configure provider webhook URLs to the **direct API host**, not Vercel.
7. Switch DNS/traffic only after `phase27_cutover_certify.ps1` passes.

## Rollback

- Roll back the frontend Vercel deployment independently if SPA/proxy behavior fails.
- Roll back the API deployment independently if native API behavior fails.
- Do **not** roll database migrations backward automatically. Use a forward repair migration unless a reviewed restore is explicitly required.
- Keep provider webhook destinations on the last-known-good API deployment during rollback.

## Commands

```powershell
npm run audit:backend-phase27

$env:PHASE27_FRONTEND_URL='https://www.example.com'
$env:PHASE27_API_ORIGIN='https://api.example.com'
powershell -ExecutionPolicy Bypass -File .\tool\phase27_cutover_certify.ps1
```
