# Phase 15 — Returns, RTO + Post‑Shipment Financial Authority

Phase 15 moves the **return/RTO state machine and physical inventory decisions** to Express/PostgreSQL while preserving `VITE_RETURN_BACKEND=supabase` as rollback.

## Authority rules
- Customer return/replacement requests require an owned **delivered** order and are limited to **7 days after `delivered_at`**.
- Requested quantities are bounded by the original order-item quantity minus quantities already present in non-rejected/non-cancelled returns.
- **No stock is restored when a customer creates a return.** Stock can increase only after admin records physical receipt and inspection.
- `accepted_quantity <= quantity` and `restocked_quantity <= accepted_quantity` remain database invariants.
- Accepted refund quantities calculate their refund from the immutable order-item price snapshot and hand financial execution to the Phase 14 refund authority using the return UUID as the idempotency key.
- Accepted replacement quantities move to `replacement_pending`; explicit admin resolution authorizes the replacement. Outbound replacement shipment creation remains fulfillment authority and is intentionally separate.
- RTO records use the same inspection/restock path. Carrier/Shiprocket webhook cutover is not implied by this phase.

## API
- `GET /api/v1/returns`
- `POST /api/v1/orders/:id/returns`
- `GET /api/v1/admin/returns`
- `POST /api/v1/admin/returns/:id/approve`
- `POST /api/v1/admin/returns/:id/status`
- `POST /api/v1/admin/returns/:id/inspect`
- `POST /api/v1/admin/returns/:id/resolve`
- `POST /api/v1/admin/returns/rto`

## Feature gate
`VITE_RETURN_BACKEND=supabase` is the production-safe default. Enable `express` only after staging migration/runtime tests.
