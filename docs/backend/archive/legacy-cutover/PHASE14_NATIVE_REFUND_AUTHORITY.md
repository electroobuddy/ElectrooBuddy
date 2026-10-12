# Phase 14 — Native Refund + Cancellation Financial Authority

Phase 14 migrates pre-return Razorpay refund authority from Supabase Edge Functions to the Express/PostgreSQL backend. Shipment creation, physical return/RTO inspection, replacement fulfillment, and post-return resolution remain outside this phase.

## Financial invariants

- Only captured native Razorpay orders in `paid` or `partially_refunded` state are refundable.
- Customer requests are ownership-scoped and must refund the full remaining balance.
- Admins may issue a controlled partial refund up to the remaining refundable balance.
- `order_refunds(order_id, request_key)` is the durable idempotency key.
- A provider-attempt claim prevents concurrent callers with the same request from both issuing a Razorpay refund.
- Before a new provider call, the service lists existing Razorpay refunds for the payment and matches `refund_id` / `request_key` notes. This recovers from response-loss ambiguity without issuing a duplicate refund.
- Provider amount, currency, and payment ID are revalidated before local finalization.
- Only provider `processed/refunded` state contributes to `orders.refunded_amount`.
- A full confirmed refund cancels and releases inventory/coupon accounting only when no Shiprocket order exists and the order is not already shipped/delivered.
- Partial refunds never restock inventory or restore coupon usage.
- Delivered/out-for-delivery orders remain in the return workflow.

## API

- `POST /api/v1/orders/:id/refunds` — authenticated customer full remaining refund.
- `POST /api/v1/admin/orders/:id/refunds` — admin full/partial refund.
- `GET /api/v1/refunds` — customer refund history.
- `POST /api/v1/admin/refunds/reconcile` — admin reconciliation trigger.
- `POST /api/v1/webhooks/razorpay` — existing raw-body endpoint now dispatches refund events as well as payment events.

## Webhooks

Refund events use the same dedicated Razorpay webhook secret, but are stored in the separate `refund_events` ledger. `provider_event_id` is preferred for deduplication; SHA-256 of the raw body is the fallback. The webhook then fetches the refund directly from Razorpay before updating financial state.

## Reconciliation

`npm run refund:reconcile` claims stale `requested/provider_pending` refund rows with `FOR UPDATE SKIP LOCKED`, then fetches a known Razorpay refund or discovers one by payment + notes. This recovers webhook loss and ambiguous provider responses.

## Frontend cutover

Keep production default:

```env
VITE_REFUND_BACKEND=supabase
```

For isolated staging after migration + provider configuration:

```env
VITE_ORDER_BACKEND=express
VITE_CHECKOUT_BACKEND=express
VITE_REFUND_BACKEND=express
```

The customer Orders page and Admin Payments page then use the native refund APIs. The legacy Supabase refund functions remain available for rollback until the native path is certified.
