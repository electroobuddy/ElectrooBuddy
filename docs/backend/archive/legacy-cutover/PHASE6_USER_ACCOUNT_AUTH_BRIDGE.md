# Phase 6 — User/Profile/Address APIs + Native Auth Frontend Bridge

## Scope
Phase 6 adds native browser session bridging and user-owned profile/address APIs. Existing checkout/payment/booking/subscription/refund/return/fulfillment authorities remain on Supabase.

## Browser session model
- Access JWT: short lived; held in memory/sessionStorage for bearer calls.
- Refresh token: rotating opaque secret in an HttpOnly cookie scoped to `/api/v1/auth`.
- `fetch(..., credentials: "include")` is required for refresh/login/logout.
- API CORS remains explicit allowlist with credentials enabled.
- Session restore calls `/auth/refresh` then `/auth/me`.
- 401s from protected non-auth routes trigger one deduplicated refresh attempt and one retry.

## Feature gates
Production rollback defaults remain:
- `VITE_AUTH_BACKEND=supabase`
- `VITE_STORAGE_BACKEND=supabase`

Staging cutover order:
1. Migrate/import portable users.
2. Sync profiles/addresses and verify parity.
3. Enable `VITE_AUTH_BACKEND=hybrid` in staging. Supabase remains authoritative for legacy authenticated domains while an identity-matched native session is established in parallel.
4. Validate customer/admin/technician login, restore, logout, role enforcement.
5. Validate profile/address ownership and CRUD.
6. Only for validated identity-matched native admin sessions set `VITE_STORAGE_BACKEND=express`.
7. Do not use `VITE_AUTH_BACKEND=express` globally until cart/bookings/subscriptions/notifications and other Supabase-auth-dependent domains are migrated.

## Ownership
User IDs are never accepted from profile/address request bodies. `req.auth.userId` is the sole ownership authority.

## Data migration
`npm run account:sync-source` is dry-run by default. `-- --apply` writes only to target PostgreSQL. `npm run account:verify-parity` compares source/target IDs.
