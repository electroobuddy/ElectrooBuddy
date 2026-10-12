# R2 — Subscription Payment Authority

Implemented:
- Subscription UI now calls `create-subscription-order`; browser plan price is never payment authority.
- Razorpay checkout uses the server-returned order id, amount, currency and public key id.
- Razorpay callback now calls `verify-subscription-payment`; the browser no longer activates subscriptions.
- Verification uses constant-time HMAC comparison and additionally fetches the Razorpay payment server-to-server to confirm order id, amount, currency and captured/authorized status.
- Added subscription checkout idempotency via `(user_id, request_id)`.
- `user_subscriptions` customer RLS is now SELECT-only. Customer INSERT/UPDATE/DELETE policies are removed.
- `subscription_orders` remain customer-readable but server-managed.
- Added atomic `activate_verified_subscription` RPC: locks order, requires `created`, prevents payment reuse, transitions order to paid, expires previous active subscription, and inserts the new active subscription in one transaction.
- Razorpay subscription webhook now uses constant-time signature comparison and the same atomic activation RPC, providing recovery when the browser closes after payment.
- Browser-side subscription auto-expiration was removed; active queries require `end_date > now()`.
- Browser-side benefit usage mutations were removed; R1 booking authority owns benefit consumption.
- Service-role remains the only financial mutation authority.

Deploy:
1. Apply `20260925_r2_subscription_payment_authority.sql`.
2. Deploy `create-subscription-order`, `verify-subscription-payment`, and `razorpay-subscription-webhook`.
3. Confirm `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
4. Configure Razorpay webhook for payment captured/failed events.
5. Deploy frontend.
6. Test successful payment, invalid signature, wrong amount/order, double callback, browser close after payment, webhook retry, duplicate request, inactive plan and existing active subscription.

Build note:
A production Vite build was attempted in this sandbox; dependency binaries remain unusable (`vite: Permission denied`), so no successful build is claimed.

Next: R3 — Product Checkout Transaction Integrity.
