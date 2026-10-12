# Phase 12 — Razorpay Payment Verification, Webhooks, Reconciliation

## Authority boundary
Native Razorpay checkout can be enabled only when both checkout creation and payment verification point to the same Express/PostgreSQL authority. Refunds remain outside this phase.

## Verification invariants
1. Authenticated user owns the internal order.
2. Checkout is still payable and inventory remains reserved.
3. Browser Razorpay signature is HMAC-SHA256 verified using the server secret.
4. Razorpay payment is fetched server-to-server.
5. Provider `order_id`, amount in paise, INR currency, and captured/authorized status match the internal order.
6. `orders.razorpay_payment_id` remains globally unique.
7. The order row is locked before the pending → paid transition.
8. Coupon `used_count` is incremented only when the reservation is first consumed.

## Webhook rules
`POST /api/v1/webhooks/razorpay` is mounted with `express.raw()` before JSON parsing. `x-razorpay-signature` is verified against `RAZORPAY_WEBHOOK_SECRET`. Events are deduplicated using provider event ID when available and otherwise the raw-payload SHA-256.

Only `payment.captured` and `order.paid` can finalize native commerce payments. Unknown events are recorded and ignored. Payment provider data is fetched again before finalization.

## Reconciliation
`npm run payment:reconcile` claims pending native Razorpay orders, queries Razorpay server-to-server, and repairs a missing browser callback/webhook without bypassing normal amount/currency/order/status checks.

## Still excluded
Refund initiation, refund webhooks, partial refunds, returns and post-payment fulfillment remain later authorities.
