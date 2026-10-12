# FAPI-12 — Operations Dashboard API Integration

## Scope

Added a permission-aware admin operations dashboard over the native `/admin/ops/status` endpoint.

## Delivered

- Added typed `OpsStatusSnapshot`, worker run, and lease contracts.
- Added `getNativeOpsStatus()` to the native admin API wrapper.
- Added `/admin/operations` route and System-navigation entry gated by `admin:security`.
- Shows all seven scheduled workers, latest status, timestamps, duration, processed count, stale state, and latest error.
- Shows failures from the previous 24 hours and active database worker leases.
- Auto-refreshes operations state every 30 seconds and supports explicit retry/refresh.
- Manual notification-outbox and fulfillment processing is exposed only when the signed-in admin also has `admin:write`; these buttons call existing protected backend actions rather than inventing new worker bypasses.
- Users with `admin:security` but without `admin:write` receive a read-only operations view.

## Safety

No direct database access or client-side worker execution was introduced. Payment/refund/shipment/subscription reconciliation workers remain scheduler-controlled because no generic safe manual-run API exists for them.

## Regression

Run `npm run audit:fapi12`.
