# FAPI-14 — Unified Frontend Data Layer

## Status
PASS — 16/16 dedicated checks.

## What changed
- Standardized frontend server-state caching on the existing TanStack Query v5 dependency.
- Added a single shared `QueryClient` with common stale-time, garbage-collection, retry, retry-delay, reconnect, and mutation defaults.
- Added centralized public/private query-key namespaces.
- Moved public services, team, testimonials, projects, products, admin dashboard/orders/bookings/products/users/services/messages to query-backed hooks.
- Product pagination now uses `useInfiniteQuery` instead of a separate Zustand cache.
- Removed the legacy custom `cacheManager` implementation.
- Removed the legacy product Zustand cache store.
- Service Zustand state now delegates all network/cache authority to TanStack Query instead of keeping a second TTL cache.
- Public API GET helpers accept `AbortSignal`, enabling TanStack Query cancellation on unmount/query replacement.
- Site settings now use `queryClient.fetchQuery`, deduplicating requests across Navbar/Footer/cards/pages.
- Admin mutation invalidation now targets shared query keys.
- Private/admin query cache is cancelled and cleared across login/logout/logout-all boundaries to prevent cross-account stale data.

## Shared defaults
- Default stale time: 60 seconds unless overridden by domain cache policy.
- Default GC time: 30 minutes.
- Retries: maximum 2 attempts, only for retriable API/network failures.
- Exponential retry delay capped at 8 seconds.
- Refetch on reconnect enabled.
- Refetch on window focus disabled to control unnecessary API usage.
- Mutations do not automatically retry.

## Validation
- FAPI-14 dedicated audit: 16/16 PASS.
- FAPI-1 through FAPI-13 regression gates: PASS.
- Phase 24 zero-Supabase gate: PASS.
- Phase 29 launch-readiness gate: 43/43 PASS.
- Modified TS/TSX transpile validation: 11/11 PASS.

## Commands
```powershell
npm run audit:fapi14
```

For dependency-linked validation on a machine with npm registry access:
```powershell
npm ci
npm test
npm run build
```
