# Phase 21 Cutover Runbook

1. Install dependencies and run migrations through `020_booking_financial_authority.sql`.
2. Keep native/hybrid auth enabled so booking customers obtain an Express session.
3. Test: no-discount booking, valid/expired coupon, per-user/global coupon limits, subscription percentage benefit, free service call, coupon-vs-subscription winner, duplicate create request, customer cancellation, admin cancellation, and concurrent duplicate requests.
4. Verify cancellation decrements a Phase-21 coupon exactly once and restores one subscription benefit usage exactly once.
5. Run `npm run audit:backend-phase21` and the full server test/build suite.

Legacy Supabase functions remain in the repository only as rollback artifacts; active booking frontend callers have been retired.
