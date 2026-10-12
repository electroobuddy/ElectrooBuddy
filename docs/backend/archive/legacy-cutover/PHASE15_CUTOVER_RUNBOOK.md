# Phase 15 Cutover Runbook
1. Install dependencies and run all database migrations through `014_native_returns_rto_authority.sql`.
2. Run server typecheck/tests/build and `python tool/phase15_returns_rto_audit.py`.
3. In staging keep Auth/Order/Refund on Express and set `VITE_RETURN_BACKEND=express`.
4. Test delivered order inside 7-day window, expired window, duplicate idempotency key, partial quantities, overlapping returns, replacement request, physical receipt, inspection, restock once, refund-after-return, partial acceptance, rejection, RTO receipt and RTO inspection.
5. Confirm creating/approving a return never changes inventory before inspection.
6. Confirm repeated inspection cannot restock more than newly accepted quantity.
7. Confirm refund resolution creates/reuses the Phase 14 refund row and does not call a second independent refund path.
8. Keep Shiprocket/carrier webhook and replacement outbound shipment authority on the existing fulfillment backend until its dedicated phase.
9. Rollback frontend authority with `VITE_RETURN_BACKEND=supabase`; never manually duplicate native return rows into Supabase.
