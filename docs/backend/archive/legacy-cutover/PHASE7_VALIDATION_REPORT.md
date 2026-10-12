# Phase 7 Validation Report

## Static gates
Phase 0 through Phase 7 architecture/static audits pass. The immutable Phase 0 baseline remains 67 frontend Supabase consumers / 23 RPCs / 19 business functions / 78 migration artifacts. Current broad Phase 0 scan is 63 frontend Supabase consumers and 23 RPCs.

## Security/integrity checks
- All authenticated cart/wishlist routes require the Phase 3 database-backed native session and explicit permissions.
- User ownership comes only from `req.auth.userId`.
- Browser price/name/image/installation-charge values are never accepted as authoritative cart fields.
- Active product, current price, current installation charge and inventory come from PostgreSQL.
- Add/update operations lock the product and relevant cart row; inventory checks account for the total quantity of a product across installation variants.
- Guest cart is cleared only after a successful server merge.
- Checkout/payment/coupon/inventory reservation financial authority is not cut over.

## Runtime limitation
No `node_modules` directories are present in this package, so a dependency-backed TypeScript/Vitest/build run was not claimed in this sandbox. Run `npm install` at root and in `server/`, then the normal build/test/typecheck commands in CI/local staging.
