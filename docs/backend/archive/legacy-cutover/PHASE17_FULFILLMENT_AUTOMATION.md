# Phase 17 — Fulfillment Automation + Replacement Shipment Authority

## Scope
Phase 17 turns the Phase 16 Shiprocket integration into a durable operational workflow.

### Order automation
Eligible confirmed orders are inserted into `fulfillment_jobs` only when native shipping is enabled and `auto_create_shipment=true`. Online Razorpay orders must already be paid. Workers claim jobs atomically and the existing shipment creation path re-validates the order before calling Shiprocket.

### Retry and dead-letter
`FULFILLMENT_MAX_ATTEMPTS` bounds provider attempts. Failed calls move to `retry` with `FULFILLMENT_RETRY_MINUTES` delay. When the attempt budget is exhausted the job becomes `failed` and receives `dead_lettered_at`. Stale `processing` locks are recovered using `FULFILLMENT_STALE_LOCK_MINUTES`.

Manual retry clears the local dead-letter state and attempt counter only; it does not weaken payment/order eligibility checks.

### Replacement shipments
Approved replacements do not reuse the original order fulfillment row. `replacement_shipments` is keyed by the Phase 15 `order_returns.id`, so the outbound replacement has independent provider IDs, AWB, retries, documents and operational history.

A replacement can only ship when:
- `return_type = replacement`
- return status is `replaced`
- `replacement_authorized_at IS NOT NULL`
- at least one accepted replacement item exists

### Documents
Labels and manifests are generated through the server-side Shiprocket provider and stored on fulfillment records. Browser code never receives Shiprocket credentials.

### Worker
Run `npm run fulfillment:process` periodically. The worker performs:
1. stale-lock recovery;
2. eligible-order queueing;
3. normal-order fulfillment;
4. authorized replacement queueing;
5. replacement fulfillment.

The worker is designed for repeated invocation and relies on PostgreSQL state/claims rather than in-memory scheduling.
