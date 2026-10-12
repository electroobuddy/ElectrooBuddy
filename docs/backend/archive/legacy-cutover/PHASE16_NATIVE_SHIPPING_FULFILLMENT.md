# Phase 16 — Native Shipping + Shiprocket Fulfillment Authority

Phase 16 moves shipment creation, AWB assignment, pickup scheduling, tracking synchronization, carrier cancellation, Shiprocket webhook processing and RTO carrier-event handoff to Express/PostgreSQL.

## Boundaries
- Browser never receives Shiprocket credentials.
- `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` and `SHIPROCKET_WEBHOOK_TOKEN` are server environment secrets.
- Shipment creation is allowed only for non-cancelled orders; Razorpay orders must be paid first.
- Carrier cancellation never automatically refunds or restocks inventory.
- RTO carrier events create/update the Phase 15 RTO return record, but physical inspection remains the only restock authority.
- Refunds remain Phase 14 authority.

## Native endpoints
- `GET|PUT /api/v1/admin/shipping/settings`
- `POST /api/v1/admin/shipping/test`
- `POST /api/v1/admin/orders/:id/shipment`
- `POST /api/v1/admin/orders/:id/shipment/cancel`
- `POST /api/v1/admin/orders/:id/shipment/sync`
- `POST /api/v1/webhooks/fulfillment`

## Feature gate
`VITE_SHIPPING_BACKEND=express` enables the native admin shipment path. Keep `legacy`/unset during rollback.
