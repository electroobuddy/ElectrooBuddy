# FAPI-8 — Orders, Returns & Refunds API Integration

## Status
PASS (static/source certification)

## Main changes

- Added authenticated `GET /api/v1/orders/:id/lifecycle`.
- The lifecycle response is now the frontend authority for post-purchase actions and contains:
  - persisted order state,
  - refund records and provider status,
  - return/replacement records,
  - cancellation/refund/return capabilities,
  - seven-day return-window end time,
  - remaining refundable amount,
  - remaining returnable quantity per order item.
- Order list responses now include server-derived `post_purchase` capabilities.
- Removed frontend cancellation/return eligibility calculations.
- Paid Razorpay cancellation uses the server-provided `can_refund_to_cancel` capability.
- COD/unpaid cancellation uses `can_cancel`.
- Return/replacement buttons use `can_return` and lifecycle item quantities.
- Refund and return request idempotency keys are stable across uncertain retries and cleared only after confirmed success.
- User order details expose current refund/provider state and return/replacement state.
- Secure public order tracking is typed and uses normalized API errors.
- Fixed order-line receipt calculation to use persisted `total_price` rather than the nonexistent `item.price` field.
- Order receipt/success output uses persisted order total/payment status and exposes refunded amount.

## Certification

- FAPI-8 audit: 21/21 PASS
- FAPI-1 through FAPI-7 regression gates: PASS
- Phase 24 zero-Supabase gate: PASS
- Phase 29 static launch-readiness gate: 43/43 PASS
- Modified TypeScript/TSX transpile: 8/8 PASS

## Runtime validation boundary

The handoff does not contain installed `node_modules`, so run the dependency-linked checks in a normal project environment:

```powershell
npm ci
npm test
npm run build
npm --prefix server install --package-lock-only
npm --prefix server ci
npm --prefix server run verify
```

The inherited `server/package-lock.json` blocker remains until registry access is available.
