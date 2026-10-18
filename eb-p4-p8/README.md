# ElectrooBuddy P4–P8 staged seed pack

Based on `server/database/migrations/001_baseline.sql` (GitHub default branch). Run each SQL file separately in Neon SQL Editor after checking the development database identity and backing it up. **Never run automatically against production.** All imports are optional and designed to be re-runnable; they do not update existing records. Inspect conflicts manually.

1. `01-P4-product-drafts.sql` adds 15 INACTIVE illustrative product drafts for the 10 existing category names; prices/stock are placeholders, **not offers to customers**. Verify that your P3 category names match. App currently stores `products.category` as text, not foreign key.
2. `02-P5-shipping-tax-drafts.sql` adds two INACTIVE draft shipping zones and one INACTIVE tax placeholder. No shipping rates: fill `shipping-rate-template.csv` with actual courier/service rates before setting zones active. No tax rate is assumed; category-based HSN/GST mapping must be reviewed.
3. `03-P6-subscription-drafts.sql` creates 3 INACTIVE concepts with 0 placeholder price, 0 included visits and no promises. Set real terms before activation.
4. `04-P7-promotions-drafts.sql` adds one INACTIVE sample coupon and offer (not redeemable).
5. `05-P8-content-templates.sql` only shows insert examples, and deliberately makes no fabricated testimonials/projects/team records. Use verified content from `real-content-template.csv`.
6. `06-readiness.sql` counts records and active statuses.

Before publishing products, validate price, cost, images, branding, warranty, inventory, specs, delivery and GST; shipping should have valid active region-specific rates and tax rules; subscriptions need real pricing and terms; coupons/offers need real approved discount and validity. Confirm checkout calculation compatibility for all changes.

The seed files are *not* a deployed live storefront. Database writes have not been performed. No account credentials are needed for running these SQL files in Neon SQL Editor.
