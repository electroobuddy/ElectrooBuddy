# Portable PostgreSQL migrations

Phase 1 intentionally contains no application tables. Phase 2 will create the canonical portable PostgreSQL baseline here.

Rules:
- migrations are ordinary PostgreSQL SQL and must run on Neon and standard PostgreSQL;
- no Supabase RLS/Auth/Storage dependencies;
- no Neon-only business invariants;
- financial concurrency uses database transactions/constraints/row locking;
- IDs remain UUID-compatible with migrated Supabase records.

## 011_razorpay_payment_authority.sql
Adds native payment verification/reconciliation metadata and the idempotent `payment_events` webhook ledger. It does not add refund authority.

### 013_native_refund_authority.sql
Adds native Razorpay refund event deduplication/reconciliation metadata. Refund accounting remains in `orders` + `order_refunds`; shipment/return authority is not migrated here.

### 015_native_shipping_fulfillment_authority.sql
Adds native Shiprocket fulfillment job claim metadata and shipping indexes. Credentials remain environment-only; RTO physical inspection and refund authority remain in Phases 15 and 14.
