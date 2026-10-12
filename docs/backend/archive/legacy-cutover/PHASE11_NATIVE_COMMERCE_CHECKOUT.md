# Phase 11 — Native Commerce Checkout + Inventory Reservation

## Scope
Phase 11 implements the portable Express/PostgreSQL checkout authority without moving Razorpay payment verification or refunds. The production frontend remains on the certified Supabase checkout by default.

## Authority
`POST /api/v1/checkout` is authenticated and derives all monetary values from PostgreSQL. The request supplies only product IDs, quantities, installation selections, shipping address, payment method, coupon code and a UUID idempotency key.

## Transaction boundary
The database transaction takes an advisory lock on `(user_id, checkout_request_id)`, row-locks products in deterministic UUID order, row-locks the coupon, validates coupon capacity, calculates authoritative shipping/tax/discount, decrements tracked inventory, writes the order snapshot/items and coupon reservation, and commits.

Razorpay order creation is performed only after the durable reservation transaction. If Razorpay initialization fails, a compensating transaction row-locks the order/products, releases inventory, releases the coupon reservation, marks the order cancelled, and records a checkout event.

## Idempotency
`orders(user_id, checkout_request_id)` remains unique. An advisory transaction lock prevents concurrent duplicate initialization. Replays return the existing live checkout. Expired/cancelled request IDs are rejected and callers must generate a new UUID.

## Checkout expiry
Unpaid Razorpay checkouts receive `quote_expires_at`. `npm run checkout:expire` selects expired rows with `FOR UPDATE SKIP LOCKED`, releases inventory/coupon reservation, and cancels the checkout. Run it from an external scheduler/Render cron/VPS cron. Do not depend on browser timers.

## COD
COD orders are confirmed inside the transaction, reserve inventory, and consume the coupon ledger immediately. Payment status remains pending because settlement is outside Phase 11.

## Razorpay boundary
Phase 11 creates Razorpay orders and persists `razorpay_order_id`, but the provider verification method deliberately throws until Phase 12. The frontend therefore blocks Razorpay when `VITE_CHECKOUT_BACKEND=express`; the native Razorpay creation endpoint may be exercised directly in isolated staging only.

## Production gate
Keep `VITE_CHECKOUT_BACKEND=supabase` in production until Phase 12 payment verification/reconciliation is on the same PostgreSQL authority and order parity has been validated.
