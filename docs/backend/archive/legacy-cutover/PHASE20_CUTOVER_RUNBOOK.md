# Phase 20 Cutover Runbook

1. Install dependencies and run `npm run db:migrate` in `server/`.
2. Configure native auth/API and Razorpay server secrets used by Phase 12.
3. Verify admin catalog create/edit/delete for every migrated catalog domain.
4. Verify offer product/service mappings survive edit/reload.
5. Verify active/inactive subscription plans and FK-safe deletion behavior.
6. In Razorpay test mode verify subscription order creation, successful verification, tampered signature, amount mismatch and duplicate callback behavior.
7. Close the checkout before callback after a successful test payment, then run `npm run subscription:reconcile -- --limit=50`; the subscription should activate exactly once.
8. Verify user subscription history/benefits and admin status/extension operations.
9. Run `npm run audit:backend-phase20` and the complete regression audit chain.

Rollback is application-level: the additive PostgreSQL migration is retained. Do not delete source Supabase tables/functions until downstream booking subscription-benefit authority has also migrated and staging parity is certified.
