# FAPI-2 — Typed API Contracts

## Completed
- Added `src/lib/apiContracts.ts` as the shared frontend contract layer.
- Removed default `any` from the critical API wrappers: auth/session, checkout/payment, orders, refunds, returns, booking, technician, notifications, subscriptions, admin operations, catalog-admin generics, and shipping.
- Narrowed order/admin transitions and technician status/approval inputs to server-supported unions.
- Typed Razorpay checkout and verification responses independently.
- Added `npm run audit:fapi2` to prevent regression back to default `any` in the critical API surface.

## Validation
The focused FAPI-2 audit requires zero `any` tokens in the selected API/client files and confirms the core domain contracts exist.

A dependency-linked project `tsc`/Vite build still requires `node_modules`. The local compiler probe reached only project-environment resolution errors (`import.meta.env` and the `@/` alias), not syntax errors in these files.

## Next
FAPI-3 should complete native authentication UX: password reset request/confirm, email verification/resend, logout-all/session UX, and typed auth context cleanup.
