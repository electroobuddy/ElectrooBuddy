# Phase 14 Validation Report

## Static authority gate

Run:

```powershell
python tool/phase14_refund_authority_audit.py
```

The gate verifies the native migration, Razorpay refund provider calls, request idempotency, concurrency claim, provider lookup-before-create recovery, refund event deduplication, reconciliation, transactional order/refund accounting, safe stock/coupon restoration boundary, frontend feature gate, and retained legacy rollback path.

## Runtime gate

The packaged artifact intentionally does not include `node_modules`. After installing dependencies, run:

```powershell
cd server
npm install
npm run db:migrate
npm run typecheck
npm run test
npm run build
npm run refund:reconcile -- --limit=50
```

Then run the root frontend build and the full static audit chain. Do not claim production refund cutover until Razorpay test-mode cases pass: full refund, partial admin refund, duplicate request, simultaneous duplicate request, provider timeout/response loss, webhook retry, webhook loss + reconciliation, full pre-shipment inventory/coupon restoration, and post-shipment/return-workflow blocking.
