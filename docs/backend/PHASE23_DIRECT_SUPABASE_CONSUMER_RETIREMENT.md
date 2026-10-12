# Phase 23 — Direct Supabase Table/Auth/Storage Consumer Retirement

## Goal
Remove browser-side Supabase authority after Phase 22 retired RPC and Edge Function callers. Runtime reads/writes now go through authenticated Express APIs, PostgreSQL repositories, and the storage-provider abstraction.

## Retired frontend authority
- Supabase Auth session/login/register/logout usage → native auth bridge.
- Direct profile/user/cart/catalog/order/booking/technician/admin table reads and writes → Express APIs.
- Direct Supabase Storage uploads → native media upload API / storage provider.
- Supabase Realtime notification subscription → native notification API with bounded polling.
- FCM subscription presence checks → native protected endpoint.
- Site settings, public testimonials, public counters, and technician booking history → new native endpoints.
- All native backend toggles touched by this phase default to `express`; no silent Supabase/legacy fallback remains in those paths.

## New/extended native endpoints
- `GET /api/public/stats`
- `POST /api/public/testimonials`
- `GET /api/admin/site-settings`
- `PUT /api/admin/site-settings`
- `GET /api/admin/technicians/:id/bookings?limit=10`
- `GET /api/push-subscriptions/fcm/status`

All admin/technician endpoints retain existing authentication, role, and permission middleware. Public testimonial submission retains the public-form rate limiter.

## Certification
Run:

```powershell
npm run audit:backend-phase22
npm run audit:backend-phase23
```

Phase 23 requires zero application imports of the Supabase browser client, zero direct `supabase.from/auth/storage/channel/rpc/functions` usage outside the isolated generated/legacy adapter directory, and zero RPC/Edge Function invocations.

## Intentionally retained for the next shutdown phase
`src/integrations/supabase/client.ts`, generated database types, the `@supabase/supabase-js` package, source-to-Neon migration/parity scripts, and Supabase-oriented operational compatibility assets are retained temporarily. They are no longer imported by application runtime code and can be removed in the final dependency/tooling shutdown phase after deployment parity is certified.
