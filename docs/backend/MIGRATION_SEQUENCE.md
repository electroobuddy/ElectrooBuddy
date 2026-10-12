# Backend Migration Sequence

The migration proceeds domain-by-domain while Supabase remains intact as the regression oracle.

1. Phase 0 — contract/dependency/security freeze (this phase)
2. Phase 1 — Express/TypeScript skeleton, env validation, health/readiness, errors/logging
3. Phase 2 — portable PostgreSQL baseline schema on Neon
4. Phase 3 — auth/session/RBAC
5. Phase 4 — public catalog and site content
6. Phase 5 — object storage abstraction/uploads
7. Phase 6 — customer profile/address/wishlist
8. Phase 7 — cart
9. Phase 8 — service booking authority
10. Phase 9 — technician domain
11. Phase 10 — pricing/tax/shipping/coupon authority
12. Phase 11 — product checkout + inventory reservations
13. Phase 12 — Razorpay commerce payment authority
14. Phase 13 — order state machine
15. Phase 14 — subscription authority
16. Phase 15 — Shiprocket + durable fulfillment jobs
17. Phase 16 — cancellation/refund authority
18. Phase 17 — returns/replacement/RTO authority
19. Phase 18 — notifications + FCM + preferences
20. Phase 19 — admin APIs + audit
21. Phase 20 — scheduled jobs/reconciliation
22. Phase 21 — production data migration and verification
23. Phase 22 — frontend Supabase removal
24. Phase 23 — security/load/failure testing
25. Phase 24 — financial regression certification
26. Phase 25 — production cutover
27. Phase 26 — Supabase decommission after rollback window

## Cutover rule per domain

A domain can be marked migrated only if:
- API contract implemented
- authorization tests pass
- data parity verified
- domain invariants pass
- React has no runtime Supabase path for that domain
- observability exists
- rollback method documented
