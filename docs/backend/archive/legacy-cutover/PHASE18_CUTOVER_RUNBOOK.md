# Phase 18 Cutover Runbook

1. Apply migration 017.
2. Configure SMTP and Firebase server credentials.
3. Run `npm run notification:process -- --limit=25` against staging.
4. Verify in-app, email and push for paid, shipped, delivered, refund and return transitions.
5. Verify disabled preferences suppress channels.
6. Verify duplicate domain events do not create duplicate outbox rows.
7. Verify a failing provider retries then dead-letters after max attempts.
8. Enable `VITE_NOTIFICATION_BACKEND=express` in staging.
9. Keep legacy Supabase notification functions/tables intact until production observation is complete.
