# ElectrooBuddy P1 + P3 seed pack

Validated against the `001_baseline.sql` schema and `server/src/config/env.ts` in the connected ElectrooBuddy repository.

1. Confirm you have selected the correct Neon branch/database and back up existing data.
2. Edit `01-site-settings.sql` and replace blank strings with *real* business contact details; run in Neon SQL Editor. Blank values are intentionally skipped, and existing rows are protected by `ON CONFLICT DO NOTHING`. To change an existing setting, update it explicitly using the admin UI or a reviewed UPDATE query.
3. Run `02-product-categories.sql`. Inserts ten proposed electrical retail categories with unique slugs; preserves pre-existing records.
4. Run `03-readiness-check.sql` and review results.
5. Start the API and verify `/api/v1/site-settings` and `/api/v1/categories` (check routes for exact category endpoint if your working version differs).

**Important**: `products.category` in the baseline schema is a free-text column, not a foreign key to `product_categories.id`. These scripts do *not* alter the product schema or create product records. The product-category relation is semantic only until a separately planned FK migration and repository/API alignment are implemented. Do not assign arbitrary names, prices or stock counts to products.

**Privacy**: public site settings are published through an API allowlist. Never put SMTP passwords, API credentials or JWT secrets into site_settings.
