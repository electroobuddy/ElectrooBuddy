# Phase 17 Cutover Runbook

1. Apply database migrations through `016_fulfillment_automation_replacement_shipments.sql`.
2. Configure server-only Shiprocket credentials and webhook token.
3. Start with Shiprocket test/controlled operational orders.
4. Keep `VITE_SHIPPING_BACKEND=express` only after Phase 16 shipment/webhook checks are passing.
5. Configure the worker every 5 minutes initially:
   `npm run fulfillment:process -- --limit=25`
6. Review `/admin/fulfillment` for retries/dead letters.
7. Test an authorized replacement and confirm it creates a separate Shiprocket shipment reference.
8. Generate label/manifest for one normal order and one replacement shipment.
9. Confirm a failed provider call retries without creating duplicate shipments.
10. Do not use manual retry to bypass payment, return inspection, or replacement authorization checks.

Recommended environment defaults:
- `FULFILLMENT_MAX_ATTEMPTS=5`
- `FULFILLMENT_RETRY_MINUTES=5`
- `FULFILLMENT_STALE_LOCK_MINUTES=30`
- `FULFILLMENT_WORKER_BATCH=25`
