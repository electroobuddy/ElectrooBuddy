# Phase 7 — Cart + Wishlist APIs

Authenticated cart and wishlist state can now run through Express/PostgreSQL while guest carts remain in localStorage. Cart prices, installation charges, availability, and inventory are re-read from `products` on every API response. Browser-submitted price/name/image values are ignored by the server.

## Cutover
Use `VITE_CART_BACKEND=express` only with a valid native session (`VITE_AUTH_BACKEND=hybrid` or `express`). Hybrid remains recommended because checkout and other authenticated financial domains are still Supabase-backed.

## Guest merge
Guest items are sent as `{productId, quantity, installationService}` only. The server locks products and validates active/inventory rules before inserting/updating the authenticated cart. Local storage is cleared only after a successful merge.

## Financial boundary
Cart totals are display estimates only. Checkout price/tax/shipping/coupon/payment authority remains on the existing certified Supabase backend until its dedicated migration phase.

## Existing user-state migration
Dry run: `npm run cart:sync-source`. Apply only after portable users/products are present: `npm run cart:sync-source -- --apply`. Verify UUID parity with `npm run cart:verify-parity`.

## Checkout compatibility
The current Supabase checkout remains compatible because `Checkout.tsx` sends `{product_id, quantity, installation_service}` from `CartContext` directly to `create-commerce-checkout`; the certified checkout function does not depend on the Supabase `cart_items` table being current. Server-side checkout continues to re-price products and enforce financial authority.
