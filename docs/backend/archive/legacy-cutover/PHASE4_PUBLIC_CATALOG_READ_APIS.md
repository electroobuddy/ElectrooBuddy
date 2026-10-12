# Phase 4 — Public Catalog + Read APIs

Phase 4 is the first low-risk domain migration from direct Supabase reads to the versioned Express API and portable PostgreSQL schema.

## In scope
- products
- product_categories
- services
- offers
- projects
- testimonials
- team_members
- public site_settings

## Explicitly out of scope
Checkout, inventory mutation, cart writes, bookings, payments, subscriptions, refunds, returns, fulfillment, admin writes and authentication frontend cutover remain on the existing Supabase production path.

## Endpoints
- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `GET /api/v1/product-categories`
- `GET /api/v1/services`
- `GET /api/v1/offers?visibility=home_hero`
- `GET /api/v1/projects`
- `GET /api/v1/testimonials`
- `GET /api/v1/team-members`
- `GET /api/v1/site-settings`

## Security
Public read endpoints never expose product cost, admin-only settings, credentials, provider secrets, payment data or customer data. `site_settings` is allowlisted server-side. Query parameters are Zod validated and SQL is parameterized.

## Controlled frontend cutover
`VITE_PUBLIC_READ_BACKEND=supabase` preserves the current production path. Staging can use `express`; production changes only after API + Neon data parity checks pass. This allows rollback without touching financial domains.

## Data sync
`npm run catalog:sync-source` is dry-run by default. It compares the source Supabase PostgreSQL and target Neon counts. Add `-- --apply` only after `003_public_catalog_read_indexes.sql` has been applied and backups are available.
\n## Staging sequence\n1. Run `npm run db:migrate` on Neon staging.\n2. Set `SOURCE_DATABASE_URL` only in the migration shell/CI secret context.\n3. Run `npm run catalog:sync-source` (dry run).\n4. Run `npm run catalog:sync-source -- --apply`.\n5. Run `npm run catalog:verify-parity`.\n6. Deploy Express.\n7. Set staging frontend `VITE_PUBLIC_READ_BACKEND=express`.\n8. Exercise catalog pages. Keep production on `supabase` until parity and UI regression pass.\n