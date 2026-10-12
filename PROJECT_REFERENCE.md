# ElectroBuddy — Current Project Reference

## Runtime architecture

The application has one supported backend path: **React/Vite -> Express `/api/v1` -> PostgreSQL/Neon**. There is no runtime Supabase client and no backend-selection feature flag.

### Frontend
- `src/lib/apiClient.ts` — shared API transport, timeout/error/session refresh handling
- `src/lib/apiContracts.ts` — typed API/domain contracts
- `src/lib/native*.ts` — domain API wrappers retained as naming-only modules; they all call Express
- `src/pages/` — public/user/admin pages
- `src/components/technician/` — technician portal

### API
- `server/src/routes/` — route registration
- `server/src/controllers/` — HTTP controllers
- `server/src/services/` — business authority
- `server/src/middleware/` — auth/RBAC/rate limiting/security
- `server/database/migrations/` — canonical PostgreSQL schema changes

### Production routing
Vercel serves the frontend and proxies `/api/v1/*` through `api/v1/[...path].ts` to private `API_ORIGIN`. This keeps refresh cookies first-party.

## Environment contract

Frontend:
```env
VITE_API_BASE_URL=/api/v1
VITE_RAZORPAY_KEY_ID=
```

Server: see `server/.env.example` for database, JWT, Razorpay, shipping, Firebase, SMTP, storage and operations configuration.

## Core domains
- native auth + RBAC
- public catalog/site settings
- cart/wishlist/profile/addresses
- service booking + server pricing quote
- product checkout + Razorpay/COD
- orders/tracking/cancellation
- returns/refunds/RTO
- technician application/profile/workload
- notifications/FCM/outbox
- admin operations and worker health

## Historical migration material
Supabase-to-Express migration documents are historical only and live under:

`docs/backend/archive/legacy-cutover/`

Do not use those archived feature-flag instructions for current deployment.
