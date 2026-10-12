# Supabase → portable PostgreSQL data map

## Identity

`auth.users.id` → `public.users.id` **unchanged**.

Copy safe identity metadata such as email and creation timestamps. Password migration is deferred to Phase 3; `users.password_hash` is nullable during migration. Existing profile/role/business foreign keys keep their UUID values and are repointed to `users(id)` in the new schema.

## Application tables

All existing public-table primary UUIDs are preserved. No new UUID is generated for migrated production rows.

Load order for later data migration:

1. users
2. user_roles, profiles
3. services, public content, categories, products
4. technicians
5. subscription plans/orders/subscriptions
6. bookings and benefit usage
7. coupons/shipping/tax/offers
8. addresses/cart/wishlist
9. orders/order_items/reviews
10. fulfillment/refunds/returns/events
11. notifications/preferences/push/logs
12. settings/audit/operational tables

## Supabase-only objects not copied

- RLS policies
- `auth.*` triggers/functions
- Supabase storage metadata
- realtime publication metadata
- service-role grants
- Edge Function deployment metadata

Equivalent behavior is implemented in Express/provider services in later phases.

## Schema drift note

The historical migration set contains repeated/repaired definitions. Phase 2 intentionally represents the final required application contract rather than preserving every historical intermediate state. Where current frontend usage contains booking financial fields not consistently represented by an old migration (`original_amount`, `final_amount`, `offer_applied`, etc.), the portable baseline includes them so the migration target matches the active application contract.

## Provider credential hardening

The old `shipping_settings.password` value is **not** reproduced in the portable baseline. Provider secrets move to server-side environment/secret storage. `shipping_settings.credential_secret_ref` may hold an opaque secret-manager reference, never the plaintext provider password.
