# A5.1–A5.4 regression matrix

| Area | Test | Expected |
|---|---|---|
| Auth | Access token with revoked refresh session | 401 |
| Auth | Access token with downgraded user role | 403 on admin action |
| Cart | A reads B's cart ID | 404; no disclosure |
| Cart | Concurrent add and quantity update of same product | No deadlock, valid total and inventory check |
| Cart | Concurrent toggle, quantity update and delete | No invalid duplicate rows or negative quantity |
| Cart | Cart merge with same product/installation option repeated | Unique constraint enforced or explicitly deduplicated |
| Bookings | Customer A requests B's booking by ID | 404 |
| Bookings | Technician transitions unassigned booking | 403/404 |
| Payment | Signature mismatch | 400 |
| Payment | Provider amount/currency/order mismatch | 409 |
| Payment | Provider status authorized but not captured | 409 PAYMENT_NOT_CAPTURED |
| Payment | Captured payment verified twice | Idempotent; one state transition |
| Webhook | Replayed signed payment event | No duplicate financial side effects |
| Refund | Concurrent duplicate full refund | At most one provider refund/ledger change |

These are planned assertions, not tests that have run. Execute against test DB and mock payment provider before release.
