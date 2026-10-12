# R5 — Secure Tracking + Complete User UX / Revenue Regression

## Implemented
- Removed public booking search by partial phone/email. Public tracking now requires a high-entropy secret token.
- Added SHA-256 hashed tracking tokens to bookings and orders. Raw token is returned only at authoritative creation; database stores only the hash.
- Added SECURITY DEFINER `public_booking_tracking` and `public_order_tracking` RPCs exposing only safe tracking fields.
- Rebuilt Order Tracking as token-based tracking; order number alone is no longer a public lookup credential.
- Booking confirmation surfaces the one-time secure tracking code.
- Checkout success state carries the one-time order tracking token.
- Added state-constrained `cancel_own_order`: only owned, unpaid, unshipped pending/confirmed orders can be cancelled online. Paid orders require refund workflow.
- Added state-constrained `cancel_own_booking`; cancellation also returns an unused subscription benefit.
- Added cancellation UX to My Orders and My Bookings.
- Added stale-price protection: if the authoritative server checkout total differs from the displayed cart total, the customer must explicitly accept the new amount before Razorpay opens.
- Fixed UserBookings explicit query to include fields its UI actually renders.
- Removed another select-star from OrderSuccess.
- R1/R2/R3/R4 protections remain in place: service price authority, subscription payment authority, product idempotency/inventory/coupon/payment locking, durable fulfillment queue/retries/webhooks.

## Revenue regression matrix
PASS (source/static architecture):
1. Service price cannot be supplied as financial authority by browser.
2. Subscription cannot be activated by browser callback alone.
3. Product price/inventory/install fee are server authoritative.
4. Duplicate checkout has idempotency key.
5. Coupon capacity is serialized.
6. COD coupon accounting is explicit.
7. Razorpay order/payment/amount/currency verified server-side.
8. Payment transition is atomic.
9. Inventory expiry cleanup exists.
10. Fulfillment has durable queue + retry + failed worklist.
11. Public booking phone/email enumeration removed.
12. Public order-number-only tracking removed.
13. Customer cancellation is state constrained.
14. Paid order cannot be silently cancelled without refund handling.
15. Stale UI/server total requires customer confirmation.

## Remaining operational requirements
- Paid-order refund automation remains intentionally separate: customer online cancellation refuses paid orders until a verified Razorpay refund authority/workflow is implemented.
- Existing historical bookings/orders created before R5 have no tracking token. Signed-in owners can still view them. If public token tracking is required for historical records, issue tokens through a controlled migration/admin communication process; do not derive tokens from phone/email/order number.
- Run real Razorpay sandbox and Shiprocket sandbox tests after deployment.
- Production Vite build is not marked passed because the archived dependency executable in this environment still returns `vite: Permission denied`.

## Deploy
1. Apply `20260928_r5_secure_tracking_revenue_regression.sql`.
2. Deploy updated `create-service-booking` and `create-commerce-checkout`.
3. Deploy frontend.
4. Re-test R1–R5 end to end.
5. Do not restore broad public SELECT policies for tracking.
