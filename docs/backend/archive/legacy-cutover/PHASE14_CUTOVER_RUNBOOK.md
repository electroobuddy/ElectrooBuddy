# Phase 14 Cutover Runbook

1. Apply migration `013_native_refund_authority.sql`.
2. Configure Razorpay test credentials and `RAZORPAY_WEBHOOK_SECRET` on the Express API.
3. Ensure the Razorpay webhook endpoint remains `/api/v1/webhooks/razorpay` and refund events are enabled.
4. Run `npm run refund:reconcile` manually once and verify zero unexpected failures.
5. Set `VITE_REFUND_BACKEND=express` in staging only.
6. Exercise full customer refund, admin partial refund, duplicate requests and concurrent duplicate requests.
7. Confirm processed full pre-shipment refund restores inventory exactly once and reverses coupon usage exactly once.
8. Confirm partial refund changes only refund/payment totals; it must not restock or cancel the order.
9. Confirm orders with active shipment cannot use customer cancellation/refund path and delivered/out-for-delivery requires return workflow.
10. Schedule `refund:reconcile` every 5–15 minutes.
11. Roll back frontend authority with `VITE_REFUND_BACKEND=supabase`; do not copy native refund rows into Supabase manually.

Physical returns/RTO, replacement decisions and post-inspection refund authority remain for the next phase.
