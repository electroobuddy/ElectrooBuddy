# FAPI-1 — API Core + Razorpay Checkout Repair

## Scope

This phase repairs the frontend API foundation before the wider frontend integration work continues.

## Changes

- Fixed `src/lib/nativePayment.ts` so Razorpay verification consumes the parsed `nativeApiFetch` result instead of incorrectly calling `.json()` / `.ok` on it.
- Added explicit Razorpay verification request/result types.
- Hardened `src/lib/apiClient.ts` with:
  - normalized `NativeApiError` objects,
  - network error normalization,
  - request timeout handling,
  - request cancellation handling,
  - API request ID capture,
  - retry metadata,
  - non-JSON/invalid-envelope protection,
  - existing single-flight refresh-token retry retained.
- Updated checkout payment/checkout failure UI to use normalized API error messages.
- Added API client and payment regression tests.
- Added `npm run audit:fapi1`.

## Certification

- FAPI-1 static audit: 8/8 PASS
- Modified API/payment/checkout TypeScript syntax/transpile check: PASS
- Phase 22 regression: PASS
- Phase 23 regression: PASS
- Phase 24 regression: PASS
- Phase 25 static certification: PASS (existing missing `server/package-lock.json` warning)
- Phase 26 static readiness: PASS (same existing warning)
- Phase 27: PASS
- Phase 28: PASS
- Phase 29: PASS

## Environment limitation

The source handoff does not contain `node_modules`, so Vitest/Vite dependency-linked execution was not run in this environment. The regression tests are included and should run with `npm ci && npm test` once dependencies are installed.

## Next

FAPI-2 should introduce typed request/response contracts for the critical auth, checkout, orders, refunds, returns, technician, and admin flows, eliminating the highest-risk `any` usage before further UI integration.
