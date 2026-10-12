# Phase 19 — Native Admin/System Operations + Supabase Dependency Retirement

## Goal
Phase 19 begins actual dependency retirement instead of only adding feature-gated Express alternatives. Domains that no longer require Supabase-specific behavior are moved permanently to the native Express/PostgreSQL API.

## Permanently retired frontend domains
The following frontend screens no longer import or call Supabase:

- `/contact` contact submission
- Admin Messages
- Admin Newsletter Subscribers
- Admin Users and per-user booking history
- Admin Dashboard database/system metrics

The home-page contact/newsletter forms now also submit through Express, although `Index.tsx` remains a Supabase consumer for unrelated legacy reads and therefore is not counted as fully retired yet.

## Native endpoints
Public:
- `POST /api/v1/public/contact`
- `POST /api/v1/public/newsletter`

Admin:
- `GET /api/v1/admin/messages`
- `PATCH /api/v1/admin/messages/:id/read`
- `GET /api/v1/admin/subscribers`
- `DELETE /api/v1/admin/subscribers/:id`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id/bookings`
- `GET /api/v1/admin/system/dashboard`

All admin endpoints require the native authenticated admin session. System/database metrics additionally require `admin:security`.

## Public form safety
Public contact/newsletter endpoints use the API CORS policy, the global limiter and an additional public-form rate limiter. Contact submissions use a caller-generated UUID request key so retries do not intentionally create duplicate messages.

## PostgreSQL system metrics
The dashboard now reads portable PostgreSQL catalog/statistics views (`pg_stat_user_tables`, `pg_stat_user_indexes`, `pg_stat_database`, `pg_stat_activity`) instead of Supabase RPC wrappers. It reports the real current database size rather than assuming the old Supabase 500 MB quota.

## Retirement checkpoint
Phase 0 immutable baseline: 67 frontend Supabase consumers and 23 distinct frontend RPCs.

After Phase 19: 62 frontend Supabase consumers and 17 distinct frontend RPCs according to the immutable freeze scanner. Edge Function directories and legacy migrations remain preserved for rollback/history; deleting them is deferred until all callers are certified retired.

## Retirement criteria for every remaining dependency
A Supabase consumer may be removed only when:
1. Its Express/PostgreSQL API contract exists and is authorization-equivalent or stricter.
2. Data has been migrated/synchronized and parity has been checked.
3. Financial/inventory authority has exactly one write path.
4. Realtime behavior has a native replacement or is explicitly unnecessary.
5. A staging cutover has passed functional and failure-path tests.
6. No active frontend/admin/worker caller references the Supabase RPC/function/table path.
7. Rollback data ownership is documented before deletion of legacy infrastructure.

## Not yet retired
Remaining areas still include legacy/hybrid auth, several catalog/admin CRUD screens, subscriptions, some booking coupon/notification fallbacks, admin catalog editors, and remaining page/store direct table reads. These are inventory items for the next retirement phases, not permission to delete legacy Supabase infrastructure yet.
