# R4 — Fulfillment Reliability

Implemented:
- Durable `fulfillment_jobs` outbox with one Shiprocket job per order.
- Automatic enqueue for eligible COD confirmed/processing orders and verified Razorpay-paid orders.
- DB reconciliation watchdog re-enqueues any eligible successful order missing a job.
- Worker claims jobs with `FOR UPDATE SKIP LOCKED`; concurrent workers cannot process the same job.
- Retry state with exponential backoff and terminal failed state after six attempts.
- Stale processing leases recover after ten minutes.
- Cancellation marks unprocessed fulfillment jobs cancelled and the worker rechecks order status before provider creation.
- Shiprocket creation is idempotent against persisted `shiprocket_order_id`.
- Real order line items are sent to Shiprocket instead of one synthetic total line.
- Provider order/shipment/AWB are persisted to both order and fulfillment job.
- Admin `create-shiprocket-order` is now enqueue-only; it no longer performs fragile synchronous fulfillment.
- Admin Orders includes fulfillment job state and a Failed / Needs Attention worklist; retry action requeues securely.
- Hardened Shiprocket webhook requires `SHIPROCKET_WEBHOOK_SECRET`, uses service role, records idempotent `fulfillment_events`, and reconciles tracking/AWB.
- Provider cancellation no longer automatically financially cancels/restocks the commerce order; it marks `provider_cancelled` for controlled resolution.
- Successful orders cannot silently disappear: trigger + reconciliation watchdog + failed worklist cover enqueue failures.

Deployment:
1. Apply `20260927_r4_fulfillment_reliability.sql`.
2. Deploy `process-fulfillment-queue`, `create-shiprocket-order`, `shiprocket-webhook`.
3. Set `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_SECRET`, `INTERNAL_FUNCTION_SECRET`.
4. Configure Shiprocket webhook token to exactly match `SHIPROCKET_WEBHOOK_SECRET`.
5. Schedule `process-fulfillment-queue` every 1–5 minutes with header `x-internal-secret: <INTERNAL_FUNCTION_SECRET>`.
6. Keep the DB reconciliation watchdog enabled (pg_cron) when available.
7. Test COD enqueue, Razorpay enqueue, duplicate enqueue, provider timeout, retry/backoff, six failures, worker crash recovery, admin retry, cancellation before processing, duplicate webhook, delivered webhook, provider cancellation, and AWB persistence.

Build note:
The source package's archived Vite executable still cannot run in this Linux sandbox (`vite: Permission denied`), so no successful production build is claimed.

Next: R5 — Secure Tracking + Complete User UX/Revenue Regression.
