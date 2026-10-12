# Phase 6 Validation Report

## Static gates
- Phase 0 immutable Supabase dependency freeze: PASS
- Phase 1 Express foundation: PASS
- Phase 2 portable PostgreSQL baseline: PASS
- Phase 3 auth/session/RBAC foundation: PASS
- Phase 4 catalog reads: PASS
- Phase 5 object storage migration: PASS
- Phase 6 account/native-auth bridge: PASS

## Phase 6 security assertions
- Profile/address ownership comes only from authenticated `req.auth.userId`.
- Profile/address request bodies cannot override `user_id`.
- Refresh token is stored in an HttpOnly cookie; JavaScript holds only the short-lived access token.
- Refresh cookie is scoped to the auth path and supports `SameSite=None; Secure` for cross-site HTTPS deployment.
- Hybrid mode keeps legacy Supabase auth alive while the native session is identity-matched by UUID.
- Native/Supabase UUID mismatch revokes the native session.
- Express media uploads reuse the authenticated API client and refresh/retry path.
- Checkout/payment/booking/subscription/refund/return/fulfillment authorities remain on Supabase.

## Runtime limitation
This package contains no installed `node_modules`, so dependency-backed `tsc`, Vitest and production builds were not claimed here. Run the documented install/migrate/typecheck/test/build sequence in local CI/staging before enabling feature flags.
