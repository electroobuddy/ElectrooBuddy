# Phase 10 — Coupon + Pricing + Shipping + Tax Authority

Phase 10 introduces a read/quote-only pricing authority in Express/PostgreSQL. It deliberately does not create orders, reserve stock, consume coupons, increment coupon counters, or verify payments.

## Endpoint
`POST /api/v1/pricing/quote`

Authenticated request payload contains product IDs, quantities, installation selection, destination state, and optional coupon code. Product price, installation charge, stock, coupon eligibility, shipping rates, and tax rates are read from PostgreSQL.

## Migration boundary
- `VITE_PRICING_BACKEND=supabase` is the production-safe default.
- `VITE_PRICING_BACKEND=express` enables native quote/coupon preview in staging.
- `create-commerce-checkout` remains the final checkout authority and must re-price independently until its dedicated migration phase.

## Security invariants
- Browser prices are ignored.
- Coupon preview is non-mutating.
- Usage/new-user/per-user limits are validated from server data.
- Shipping and tax configuration are server-side.
- Inventory is checked for quote UX only; reservation still belongs to checkout.
