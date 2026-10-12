# Phase 18 — Native Notifications + Transactional Communication Authority

Phase 18 moves transactional communication from direct Supabase notification writes/functions to the Express/PostgreSQL backend.

## Authority model
- `notification_outbox` is the durable delivery queue.
- Event keys are unique so a domain transition cannot intentionally enqueue the same logical notification twice.
- PostgreSQL triggers enqueue order/payment/shipping/refund/return transitions after authoritative database state changes.
- The worker uses `FOR UPDATE SKIP LOCKED`, stale-lock recovery, bounded attempts and exponential retry delay.
- In-app notifications are persisted in `notifications`.
- Email uses SMTP server credentials only.
- Push uses Firebase HTTP v1 service-account OAuth; Firebase private keys never reach the browser.
- User preferences are applied before channel delivery.

## Frontend cutover
Set `VITE_NOTIFICATION_BACKEND=express` only after native auth is available. `legacy` retains the existing Supabase path for rollback.

## Worker
Run `npm run notification:process -- --limit=25` every few minutes initially.
