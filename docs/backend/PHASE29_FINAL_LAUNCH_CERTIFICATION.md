# Phase 29 — Final Live Production Launch Certification

Phase 29 is the last launch gate. Static readiness alone cannot produce a **GO**. The live certifier fails closed if production URLs, database access, provider configuration, backup evidence, restore-drill evidence, scheduler evidence, or webhook protections are missing.

## Required evidence

Set the real production values only in your shell/secret manager; never commit them:

- `PHASE29_FRONTEND_URL` — deployed Vercel HTTPS URL/custom domain.
- `PHASE29_API_ORIGIN` — deployed Express HTTPS origin.
- `DATABASE_URL` and preferably `MIGRATION_DATABASE_URL`.
- `PHASE29_BACKUP_MANIFEST` — JSON sidecar produced by `tool/ops/neon_backup.ps1`.
- `PHASE29_RESTORE_DRILL_EVIDENCE` — captured successful output/report from a disposable restore drill.
- Production Razorpay, Shiprocket, Firebase, SMTP, storage, and operations alert secrets.

By default the final gate requires providers: `razorpay,shiprocket,firebase,smtp,storage,ops-alert`. Override only when a provider is genuinely not part of the production product with `PHASE29_REQUIRED_PROVIDERS`.

## Scheduler acceptance

All seven managed workers must have a latest `succeeded` run within `PHASE29_WORKER_MAX_AGE_MINUTES` (defaulting to `OPS_STALE_WORKER_MINUTES`), and there must be zero failed worker runs in the preceding 24 hours:

1. `checkout-expiry`
2. `payment-reconciliation`
3. `refund-reconciliation`
4. `shipment-sync`
5. `fulfillment-queue`
6. `notification-delivery`
7. `subscription-reconciliation`

Run each worker once after deployment before asking Phase 29 for GO, then enable your real scheduler.

## Windows certification

```powershell
$env:PHASE29_FRONTEND_URL='https://www.example.com'
$env:PHASE29_API_ORIGIN='https://api.example.com'
$env:DATABASE_URL='postgresql://...'
$env:MIGRATION_DATABASE_URL='postgresql://...'
$env:PHASE29_BACKUP_MANIFEST='C:\secure\backups\electroobuddy-....dump.json'
$env:PHASE29_RESTORE_DRILL_EVIDENCE='C:\secure\backups\restore-drill.txt'

powershell -ExecutionPolicy Bypass -File .\tool\phase29_launch_certify.ps1
```

The script runs Phases 22–29 regression gates, frontend tests/build, deterministic server install, server verification, database status/migration/verification, and the final live GO/NO-GO certifier.

## Live safety checks

The certifier sends deliberately invalid signatures/tokens to Razorpay and fulfillment webhook endpoints and requires them to be rejected with 400/401/403. It never creates orders, charges payments, refunds money, or mutates customer records.

## GO policy

**GO** requires every executed final gate to pass. There are no SKIP results in Phase 29. Missing evidence is a NO-GO blocker.
