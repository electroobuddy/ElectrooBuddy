# Phase 20 — Native Catalog/Admin CRUD + Subscription Authority Retirement

Phase 20 retires direct frontend Supabase authority for product, category, service, offer, project, team, testimonial and subscription-plan administration. Admin writes now require the native admin session and `admin:write` permission. Offer mappings are updated transactionally with the offer.

Subscription plans are public read-only through Express. Authenticated subscription checkout reads price, currency and duration from PostgreSQL, creates the Razorpay order server-side, verifies the checkout HMAC, fetches the payment from Razorpay, compares provider order/amount/currency/status, and activates the subscription under a PostgreSQL lock. A reconciliation command repairs successful Razorpay payments whose browser callback was missed.

Coupon administration deliberately remains outside this phase because coupons are part of pricing/discount financial authority rather than generic catalog CRUD.

## Native routes
- `GET/POST/PATCH/DELETE /api/v1/admin/catalog/:kind`
- `GET/POST/PATCH/DELETE /api/v1/admin/catalog/offers`
- `GET /api/v1/subscription-plans`
- `GET /api/v1/subscriptions`
- `GET /api/v1/subscriptions/:id/benefits`
- `POST /api/v1/subscriptions/checkout`
- `POST /api/v1/subscriptions/razorpay/verify`
- `GET /api/v1/admin/subscriptions`
- `GET /api/v1/admin/subscription-orders`
- `PATCH /api/v1/admin/subscriptions/:id`

## Safety boundaries
- Browser supplied subscription price/duration is ignored.
- Razorpay secret is server-only.
- Payment activation requires valid HMAC plus a provider lookup and exact order/amount/currency match.
- Existing active subscriptions are expired atomically when a newly paid plan activates.
- Plan deletion is blocked by PostgreSQL FK constraints while referenced; admins can deactivate a plan instead.
- Legacy Supabase artifacts remain available for rollback, but the active subscription UI no longer invokes the two subscription Edge Functions.
