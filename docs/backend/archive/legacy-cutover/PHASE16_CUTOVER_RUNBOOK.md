# Phase 16 cutover

1. Apply migration `015_native_shipping_fulfillment_authority.sql`.
2. Configure `PUBLIC_API_URL`, `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION`, `SHIPROCKET_WEBHOOK_TOKEN` on the API host.
3. In Shiprocket, configure the returned `/api/v1/webhooks/fulfillment` URL and the same security token.
4. Enable shipping settings through the admin UI and test the connection.
5. In staging set `VITE_SHIPPING_BACKEND=express`.
6. Test prepaid paid order, COD order, duplicate create click, AWB assignment, pickup, tracking sync, webhook replay, cancellation-before-dispatch, RTO in transit, RTO received, delivered event.
7. Verify carrier cancellation does not restock or refund, and RTO does not restock until Phase 15 inspection.
8. Roll back frontend writes by removing/changing `VITE_SHIPPING_BACKEND=express`; do not delete native provider records.

Recommended reconciliation job: `npm run shipping:sync -- --limit=50` every 10–15 minutes as a missed-webhook safety net.
