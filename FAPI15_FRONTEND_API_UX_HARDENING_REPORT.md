# FAPI-15 — Frontend API UX Hardening

## Completed

- Added a shared `ApiState` component for loading, API failure, offline, empty and retry states.
- Added `MutationButton` for duplicate-submit protection, progress feedback and offline mutation blocking.
- Added a global offline banner driven by browser `online` / `offline` events.
- Existing `PublicApiState` now delegates to the unified API-state surface, so public pages inherit the same offline/error/retry behavior.
- Hardened the cart loading/error/refetch path and fixed missing cart-context destructuring for `loading`, `error`, `refreshCart` and `mutating`.
- Checkout pricing failures now use the shared retry/error UI and final order submission uses mutation progress protection.
- User Orders now preserves load errors for retry UI, has an explicit empty state, and prevents duplicate cancel/refund/return submissions.
- Technician Bookings now uses normalized API errors, shared loading/error UI and mutation progress controls.
- Admin Operations now uses shared error/retry UI and mutation-safe manual worker controls.

## Validation

- FAPI-15 audit: **21/21 PASS**
- FAPI-1 through FAPI-14 regression gates: **PASS**
- Phase 24 zero-Supabase production audit: **PASS**
- Phase 29 launch readiness: **43/43 PASS**
- Modified TS/TSX transpile: **11/11 PASS**

## Command

```powershell
npm run audit:fapi15
```

## Remaining dependency-linked verification

This source handoff does not include installed `node_modules`. Run in the normal development environment:

```powershell
npm ci
npm test
npm run build
```
