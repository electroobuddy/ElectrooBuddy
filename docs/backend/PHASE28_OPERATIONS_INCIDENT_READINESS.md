# Phase 28 — Operations & Incident Readiness

## Worker scheduling
Run each worker from exactly one scheduler. Database leases make accidental overlap safe, but do not intentionally configure duplicate schedules.

Recommended baseline cadence:
- checkout expiry: every 5 minutes
- payment reconciliation: every 10 minutes
- refund reconciliation: every 10 minutes
- fulfillment queue: every 5 minutes
- shipment sync: every 15 minutes
- notification delivery: every 2–5 minutes
- subscription reconciliation: every 30 minutes

Every execution writes `ops_worker_runs`; active leases live in `ops_worker_leases`. Admins with `admin:security` can read `/api/v1/admin/ops/status`.

Set `OPS_ALERT_WEBHOOK_URL` to an HTTPS incident webhook. Worker failures trigger a JSON alert. Do not place secrets in webhook URLs.

## Monitoring
External uptime monitoring should check:
1. `/api/v1/health` every minute (process liveness)
2. `/api/v1/ready` every 2–5 minutes (database readiness)
3. Vercel proxied `/api/v1/ready` to verify frontend→proxy→API reachability

Alert if readiness fails twice consecutively or if any critical worker is stale beyond `OPS_STALE_WORKER_MINUTES`.

## Backup policy
Use Neon point-in-time recovery / branch restore where available as the primary managed recovery mechanism, plus periodic logical backups for provider-independent recovery.

Run `tool/ops/neon_backup.ps1` from a protected operator machine/CI runner. Store `.dump` and `.dump.json` together in encrypted, access-controlled storage. Never commit backups to Git.

Suggested minimum: daily logical backup, 14 daily copies + 8 weekly copies. Match retention to business/legal requirements.

## Restore drill
At least monthly, restore the latest backup into a disposable Neon database/branch:

```powershell
$env:RESTORE_DRILL_DATABASE_URL="postgresql://...disposable..."
.\tool\ops\neon_restore_drill.ps1 -BackupFile .\backups\electroobuddy-YYYYMMDD-HHMMSS.dump
```

The script refuses a target URL equal to `DATABASE_URL` or `MIGRATION_DATABASE_URL`, verifies SHA-256 when a manifest exists, restores, and checks tables/migrations.

## Incident procedure
1. Declare incident owner and timestamp.
2. Check `/health`, `/ready`, deployment logs, and `/admin/ops/status`.
3. Stop or disable the affected scheduler if a worker is causing damage; leases expire automatically.
4. For payment/refund/provider incidents, preserve webhook/event data and avoid manual state edits unless a runbook explicitly requires it.
5. For database incidents, prefer Neon PITR/branch recovery; use logical restore only after validating backup checksum in a disposable target.
6. Rotate any exposed secret immediately and redeploy.
7. Run Phase 22–28 gates plus live Phase 26/27 certification after recovery.
8. Record root cause, affected IDs/time window, remediation, and prevention actions.

## Production cutover requirement
Phase 28 static certification does not prove a backup exists or a restore drill has succeeded. Production sign-off requires evidence of one successful backup and one successful disposable restore drill, plus live health/readiness checks.
