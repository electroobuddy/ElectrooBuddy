# R8 — Final Production Certification & Financial State-Machine Audit

## Repairs implemented
- Added DB financial-state guard against impossible refund/payment/fulfillment combinations.
- Added protected-order-column guard so browser/admin table updates cannot alter monetary/payment/refund authority fields.
- Replaced Admin Orders direct status mutation with `admin_transition_order`.
- Removed Admin Orders hard-delete behavior; terminal orders are archived while financial history is retained.
- Added controlled `admin_transition_booking`; cancellation returns unused subscription benefit.
- Repaired Booking Details customer cancellation to call `cancel_own_booking` instead of generic booking status mutation.
- Routed admin booking status changes through the controlled transition RPC.
- Added read-only `financial_integrity_report()` covering unpaid advanced Razorpay orders, refund ledger mismatch, cancelled in-flight orders, fulfillment drift, return/restock mismatch, coupon negative counts and stranded inventory reservations.
- Added repeatable static financial audit script.

## Certified state authorities
- Service booking price/benefit/coupon: `create-service-booking`
- Subscription payment activation: subscription order + verify/webhook authority
- Commerce quote/inventory/coupon: `create-commerce-checkout`
- Razorpay commerce payment: `verify-commerce-payment` + atomic DB transition
- Fulfillment: durable fulfillment queue + Shiprocket webhook
- Pre-shipment paid cancellation: R6 refund authority
- Delivered returns/replacements/RTO: R7 return inspection authority
- Inventory restock after returns: physical accepted quantity only
- Admin order transitions: R8 state-machine RPC
- Public tracking: hashed high-entropy tokens

## Production gate
This source is **financially architecture-ready**, but not runtime-certified until all of these pass in the deployment environment:
1. Apply migrations R1→R8 in timestamp order on staging backup/clone.
2. Run `select * from public.financial_integrity_report();` using service-role/server tooling. Every count must be zero before enabling R8 guards on production data, or historical drift must be reviewed and explicitly repaired.
3. Run `python tool/r8_static_financial_audit.py`.
4. Run clean `npm ci`, `npm run build`, lint/tests.
5. Razorpay sandbox: success, duplicate callback, wrong amount/signature, abandoned checkout, partial/full refund, webhook loss + reconciliation.
6. Shiprocket sandbox: enqueue, retry, duplicate worker, AWB, delivery, cancellation, RTO.
7. Return tests: partial quantity, duplicate request, 7-day expiry, rejection, partial acceptance, double inspection, refund and replacement.
8. Verify coupon and inventory counts after every cancellation/refund/RTO case.
9. Confirm cron/schedulers for expired checkout cleanup, fulfillment worker and refund reconciliation.
10. Verify all production secrets and webhook secrets are present and rotated.

## Current environment limitation
`npm run build` still fails because the archived Vite executable returns `Permission denied`. Therefore runtime production certification is intentionally NOT claimed from this sandbox.

## Validation performed in this workspace
- `python tool/r8_static_financial_audit.py`: **PASS**.
- Direct `orders.update/delete` mutations in frontend scan: **0**.
- `npm run build`: **BLOCKED** (`vite: not found`, exit 127); archived dependencies are not a valid clean install.
