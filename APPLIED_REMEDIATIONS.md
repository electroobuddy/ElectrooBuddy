# ElectrooBuddy merged remediation

Changes: A1–A4 proxy/ignore/CI, A5 cart lock order and captured-only Razorpay finalization, guest booking route/migration/UI, regression tests, A6/A7 audit scripts, A7 strict migration-status and restore confirmation.

**Important:** no production database migration or external provider verification has run. Before deployment configure monitoring, test duplicate bookings and capture modes, and review guest abuse controls.

For strict migration check: `cd server; $env:DB_STATUS_STRICT="true"; npm run db:status` (or run db-status.ts via tsx).

Restore drill now requires `-ConfirmDisposableDatabaseName` with the exact disposable database name.

