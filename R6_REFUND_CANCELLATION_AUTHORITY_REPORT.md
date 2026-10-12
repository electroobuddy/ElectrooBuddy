# R6 — Refund & Cancellation Financial Authority

## Implemented
- Durable `order_refunds` ledger with full/partial refund type, amount, reason, provider ID/status, failure reason, timestamps and idempotent request key.
- Refund authority remains server-side. Browser cannot insert/update refund ledger rows.
- `request-order-refund` authenticates the customer/admin, validates ownership and refundable balance, and calls Razorpay from server secrets only.
- Customers can request only the full remaining balance. Admins can issue controlled partial refunds.
- Duplicate request keys return the same ledger request rather than issuing another provider refund.
- Concurrent active full refunds are blocked at the database level.
- Refund amount can never exceed the unrefunded captured amount.
- `finalize_order_refund` is the single database authority for processed/pending/failed provider transitions.
- Full confirmed refund changes payment state to `refunded`; partial confirmed refund changes it to `partially_refunded`.
- Order cancellation, inventory restoration and coupon reversal occur only after a confirmed full refund and only when no shipment has been created.
- Partial financial refunds do not incorrectly restock products or restore coupons.
- COD cancellation remains provider-free and uses the existing one-time cancellation triggers for inventory/coupon restoration.
- Customer paid-order UI now uses `request-order-refund`; it never directly marks a paid order cancelled.
- Razorpay refund webhook uses raw-body HMAC verification and constant-time signature comparison.
- `reconcile-order-refunds` rechecks provider-pending refunds against Razorpay for webhook-loss recovery.
- Admin Payments now supports full/partial refunds, reconciliation, refund history/status/error visibility and a `Refund Failed / Needs Attention` filter.
- Admin net revenue subtracts confirmed processed refunds.
- Full customer refund is blocked once a Shiprocket shipment exists; post-shipment refunds require controlled support/return handling.

## Important financial behavior
Inventory and coupon restoration are deliberately tied to the final order cancellation transition. A requested or provider-pending refund does not release inventory or coupon accounting. A partial refund never implies returned stock. A full refund after shipment creation does not automatically restock goods; that requires a later return/RTO authority workflow.

## Deploy
1. Apply `supabase/migrations/20260929_r6_refund_cancellation_authority.sql`.
2. Deploy `request-order-refund`, `razorpay-refund-webhook`, and `reconcile-order-refunds`.
3. Set/retain `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `INTERNAL_FUNCTION_SECRET`.
4. Configure Razorpay refund webhook events to the new webhook endpoint.
5. Schedule `reconcile-order-refunds` periodically (for example every 5–15 minutes) with `x-internal-secret`.
6. Sandbox-test full refund, partial refund, duplicate request, concurrent request, failed provider call, pending→processed webhook, webhook loss + reconciliation, COD cancellation, coupon restoration, inventory restoration, and shipment-created blocking.

## Validation limitation
A production frontend build could not run in this environment because the packaged dependency installation does not contain an executable Vite binary (`vite: not found`). No successful production build is claimed.

## Next recommended phase
R7 — Returns/RTO & Post-Shipment Financial Authority: return requests, delivered-order eligibility windows, item/quantity return ledger, Shiprocket cancellation/RTO synchronization, inspection/approval, partial inventory restock only after accepted return, replacement/exchange authority, and refund-after-return reconciliation.
