# FAPI-11 — Notifications & FCM API Integration

## Completed
- Aligned notification preferences UI with the native Express schema: in-app, push, email, booking, order, payment, shipping, refund and return categories.
- Removed obsolete booking-specific preference fields that the API never persisted.
- Hardened notification polling against stale responses after account changes and exposed retryable load errors.
- Typed notification center and admin outbox against native API contracts.
- Corrected outbox attempt fields to `attempt_count` / `max_attempts` and preserved retry-by-outbox-ID behavior.
- Added FCM token ownership in local storage so a token is associated with the authenticated account that registered it.
- Logout and logout-all now best-effort unregister the locally owned FCM token before clearing auth state.
- Push subscription status requires both server-active subscription and matching local token ownership.
- Automatic User/Admin/Technician layout reconciliation only runs when browser notification permission is already granted; first-time permission is explicit user action.
- Removed stale Supabase Edge Function/RPC comments from notification helpers.

## Validation
- `npm run audit:fapi11`: 14/14 PASS
- FAPI-1 through FAPI-11: PASS
- Phase 24 zero-Supabase production audit: PASS
- Phase 29 static launch readiness: 43/43 PASS
- Modified notification/auth TypeScript/TSX files transpile successfully.

## Remaining environment validation
Run the normal dependency-linked suite locally/CI:

```powershell
npm ci
npm test
npm run build
npm run audit:fapi11
```

Live FCM delivery still requires valid Firebase/VAPID credentials and a deployed HTTPS origin/service worker.
