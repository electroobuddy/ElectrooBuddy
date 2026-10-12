# Phase 12 Native Razorpay Cutover Runbook

## Before enabling native online payments
1. Apply migrations through `011_razorpay_payment_authority.sql`.
2. Configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and a dedicated `RAZORPAY_WEBHOOK_SECRET` on the API only.
3. Configure Razorpay webhook URL as `https://<api-host>/api/v1/webhooks/razorpay` with the same webhook secret.
4. Run API typecheck/tests/build in the deployment environment.
5. Validate a native checkout in Razorpay test mode and confirm `orders.payment_status=paid`, one `payment_events` record, one coupon consumption and no inventory release.
6. Test a lost browser callback by using `npm run payment:reconcile` and confirm the captured payment is repaired.
7. Test duplicate browser verification and duplicate webhook delivery; both must remain idempotent.
8. Confirm expired unpaid checkout cleanup still releases stock.

## Frontend cutover
Keep `VITE_CHECKOUT_BACKEND=supabase` until the above passes. Then enable `VITE_CHECKOUT_BACKEND=express` in staging. Phase 12 now supports both COD and Razorpay through the native checkout path.

## Rollback
Switch the frontend flag back to Supabase. Do not move already-created native orders between ledgers manually. Native orders remain authoritative in PostgreSQL and should be reconciled there.

## Not included
Refunds, partial refunds and refund webhooks remain on the certified legacy authority until their dedicated migration phase.
