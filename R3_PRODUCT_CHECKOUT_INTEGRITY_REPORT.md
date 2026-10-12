# R3 — Product Checkout Transaction Integrity

Implemented:
- Added `checkout_request_id` and unique per-user idempotency index. Checkout retries return the same active server checkout instead of reserving stock twice.
- Added 20-minute server quote expiry.
- Product prices, stock, installation availability and charges remain server-authoritative.
- Installation fee rule is now **per unit**: `installation_charge × quantity` in server checkout, Cart UI and CartContext totals.
- Added serialized coupon reservation under a coupon-row lock, including global/per-user limits, new-user restriction, minimum value/items and product restrictions.
- COD coupons are consumed when the COD order is accepted.
- Razorpay coupons are consumed only by the atomic verified-payment transition.
- Coupon accounting reverses once when a consumed order is cancelled.
- Added atomic `confirm_commerce_payment` DB function with order row lock and exactly-one pending→paid transition.
- Payment verification now uses constant-time HMAC comparison and a server-to-server Razorpay payment lookup to verify order id, amount, currency and captured/authorized status.
- Abandoned Razorpay inventory/coupon reservations expire after 20 minutes.
- Added pg_cron cleanup every 5 minutes where available, plus an internal-secret protected scheduled Edge Function fallback.
- Removed customer-browser Shiprocket invocation; fulfillment is intentionally deferred to R4 trusted/queued server workflow.
- Checkout creates the durable local order before Razorpay order creation, reducing orphan-provider-order risk.
- Cart/checkout server quote is returned with authoritative totals.

Deployment:
1. Apply `20260926_r3_product_checkout_integrity.sql`.
2. Deploy `create-commerce-checkout`, `verify-commerce-payment`, and `release-expired-commerce-checkouts`.
3. If pg_cron cannot be enabled, schedule the cleanup Edge Function every 5 minutes using `INTERNAL_FUNCTION_SECRET`.
4. Deploy frontend.
5. Regression test: duplicate submit/retry, two tabs, last-stock race, final coupon slot race, COD coupon, Razorpay success/replay/wrong amount, payment after expiry, cancellation restore, quantity>1 installation, stale cart price and abandoned checkout.

Build note: a production build is not marked passed until clean dependencies can execute Vite in the runtime.

Next: R4 — Fulfillment Reliability / Shiprocket server queue, retries and reconciliation.
