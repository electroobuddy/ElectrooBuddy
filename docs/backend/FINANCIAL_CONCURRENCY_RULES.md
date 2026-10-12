# Financial concurrency rules

These rules are mandatory for the Express implementation and future PHP implementation. Database constraints are the final safety net; service code owns the business transaction.

## Checkout and inventory

Every checkout mutation uses one PostgreSQL transaction.

1. Lock each sellable product row with `SELECT ... FOR UPDATE` in deterministic product-ID order.
2. Re-read active status, price and inventory from PostgreSQL. Never accept authoritative price or stock from the browser.
3. If a coupon is present, lock the coupon row with `FOR UPDATE` before calculating eligibility/usage.
4. Create the order using a client-generated `checkout_request_id`. `uq_orders_user_checkout_request` makes retries idempotent.
5. Reserve/decrement inventory within the same transaction and set `inventory_reserved_at`.
6. Commit only after order rows and item snapshots are consistent.

Concurrent checkout code must not lock products in arbitrary order because that increases deadlock risk.

## Coupon usage

Coupon eligibility and counters are changed only while the coupon row is locked. A pending online-payment order may reserve usage only until `quote_expires_at`. Cancellation/expiry must release the reservation exactly once. A consumed coupon must not be consumed twice after payment retries.

## Razorpay payment verification

1. Lock the target order with `FOR UPDATE`.
2. Verify provider signature and provider-side order/payment amount/currency.
3. If already paid with the same provider payment ID, return the previous successful result.
4. Reject conflicting provider payment IDs.
5. Mark payment/order state and consume reserved coupon inside one transaction.
6. Provider payment IDs are unique in PostgreSQL.

## Subscription activation

Use `subscription_orders(user_id, request_id)` for idempotency. Lock the subscription order before activation. Payment ID uniqueness prevents the same payment activating multiple subscriptions.

## Subscription benefits

Lock `user_subscriptions` before consuming a limited benefit. The partial unique index on `(booking_id, benefit_type)` prevents duplicate consumption for the same booking. Usage count and booking linkage are committed atomically.

## Refunds

1. Lock the order and refund row.
2. Compute refundable amount from server-side ledger/state, never a client amount.
3. `order_refunds(order_id, request_key)` makes requests idempotent.
4. Only one active full refund is permitted per order.
5. `orders.refunded_amount <= orders.total_amount` is enforced by PostgreSQL.
6. Provider callbacks are reconciled against persisted refund state.

## Returns / replacements / RTO

The accepted quantity can never exceed the requested quantity. Restocked quantity can never exceed physically accepted quantity. Inventory is restored only after inspection/acceptance, never when a return request is created.

## Fulfillment workers

Workers claim jobs with:

```sql
SELECT id
FROM fulfillment_jobs
WHERE status IN ('queued','retry') AND next_attempt_at <= now()
ORDER BY next_attempt_at, created_at
FOR UPDATE SKIP LOCKED
LIMIT $1;
```

`(order_id, provider)` prevents duplicate provider jobs and `(provider, event_key)` deduplicates provider webhooks.

## Locking order

For commerce operations, use the consistent lock order:

`order -> products(sorted UUID) -> coupon -> refund/return child rows`

When an operation begins from a product/coupon rather than an order, document the exception and keep ordering deterministic.

## Isolation

`READ COMMITTED` plus explicit row locks is the baseline. Use `SERIALIZABLE` only for a flow that cannot be expressed safely with row locks/constraints and implement bounded retry for serialization failures.
