# FAPI-7 — Product Checkout API Integration

## Scope

Harden the complete product purchase flow from cart pricing through COD/Razorpay checkout and the post-order success screen, keeping pricing and payment state server-authoritative.

## Completed

- Replaced checkout's local shipping/tax/discount fallback arithmetic with `/pricing/quote` as the only displayed monetary authority.
- Added the previously omitted installation total to the checkout summary and final total path.
- Coupon application now reuses the pricing quote endpoint and stores only the server-accepted coupon code.
- Added quote loading, failure and retry UX. Order submission is blocked when there is no valid server quote.
- Added a final pricing revalidation before any order is created. Price-change confirmation therefore occurs before a COD order is confirmed or Razorpay inventory is reserved.
- Preserved safe idempotent Razorpay retries: an existing checkout reservation can be reused without creating a second inventory reservation.
- Razorpay now consumes the typed `NativeCheckoutResult`, uses the server-created provider order, charges the server amount, and verifies payment against the internal order ID.
- Kept the UUID `Idempotency-Key` contract between frontend and Express.
- Aligned quote and checkout per-line quantity limits to 1–99.
- Expanded pricing quote types to reflect policy version, server line pricing and tax-line data.
- Expanded order contracts with Razorpay provider identifiers used by the UI.
- Order Success now loads the created order from Express and uses the persisted amount/payment method/status rather than navigation-state financial values.
- Added retry/error UX to Order Success.

## Certification

- `npm run audit:fapi7`: **28/28 PASS**
- FAPI-1 through FAPI-7 regression gates: **PASS**
- Phase 24 zero-Supabase gate: **PASS**
- Phase 29 static launch-readiness gate: **43/43 PASS**
- Modified TypeScript/TSX transpile: **5/5 PASS**

## Remaining validation boundary

This handoff does not contain installed `node_modules`, so the dependency-linked Vite/Vitest run remains a local/CI step:

```powershell
npm ci
npm test
npm run build
```
