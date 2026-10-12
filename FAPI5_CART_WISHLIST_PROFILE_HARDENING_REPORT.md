# FAPI-5 — Cart, Wishlist & Profile API Hardening

## Result
PASS (static/source certification)

## Changes
- Cart mutations now target the cart-line UUID instead of product ID, preventing the wrong installation/non-installation variant from being changed.
- Authenticated cart mutations are serialized to prevent stale/out-of-order server responses.
- Cart responses are identity-guarded so an in-flight response from a previous user cannot repopulate state after logout/account change.
- Guest-cart JSON parsing is defensive and corrupt local data is discarded safely.
- Guest cart mutations use functional React state updates to avoid rapid-click lost updates.
- Cart quantities are clamped to the backend's 1..99 contract.
- Cart exposes loading/error/retry state to the Cart page.
- Wishlist API contracts are fully typed; `any[]` is removed.
- Wishlist loading is stale-request safe and mutation is optimistic with rollback.
- Profile/address form is typed with the backend address enum contract.
- Profile loads are identity/stale-response guarded and expose retry UI.
- Profile and address errors use normalized NativeApiError messages.
- Default-address/delete mutations optimistically update and roll back on failure.
- ProductDetails now awaits cart mutation completion.

## Validation
- `python tool/fapi5_cart_profile_audit.py` — 18/18 PASS
- FAPI-1 — PASS
- FAPI-2 — PASS
- FAPI-3 — 23/23 PASS
- FAPI-4 — 27/27 PASS
- Phase 24 zero-Supabase — PASS
- Phase 29 launch readiness — 43/43 PASS
- Modified TS/TSX transpile check — 6/6 PASS

## Local dependency-linked verification
Run after installing dependencies:

```powershell
npm ci
npm test
npm run build
npm run audit:fapi5
```
