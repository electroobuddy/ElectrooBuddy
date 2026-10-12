# R1 — Service Booking Financial Authority

Implemented:
- Added authenticated `create-service-booking` Edge Function.
- Browser no longer inserts customer bookings directly.
- Service ID is sent to the server; server reloads service title/charge and ignores browser monetary values.
- Coupon validity, minimum, new-user and usage rules are revalidated server-side.
- Active subscription is loaded server-side.
- Free-service allowance is checked server-side.
- Subscription benefit consumption is protected by a row-locking DB trigger to prevent concurrent overuse.
- Coupon and subscription discounts no longer stack: the larger valid benefit wins.
- Added `booking_request_id` and unique user/request index for idempotent retries.
- Added `service_id` to bookings for immutable service authority/auditability.
- Direct public/authenticated booking INSERT policies are removed; admin/server paths remain.
- Client auto-assignment calls were removed.
- `auto-assign-technician` now supports only admin authorization or the trusted `INTERNAL_FUNCTION_SECRET` server-to-server path.
- BookingForm and RequestServiceSection use the shared authoritative booking client.
- Custom Service remains supported, but starts with a zero authoritative quote rather than accepting a browser-supplied price.

Important behavior change:
- R1 now requires login to submit a financially authoritative service booking. This intentionally removes anonymous direct DB booking creation. If guest booking is required later, implement a rate-limited guest booking endpoint with verification rather than reopening table INSERT RLS.

Deployment:
1. Apply `supabase/migrations/20260924_r1_service_booking_authority.sql`.
2. Deploy `create-service-booking`.
3. Redeploy `auto-assign-technician`.
4. Ensure the same `INTERNAL_FUNCTION_SECRET` is configured for both functions.
5. Deploy frontend.
6. Regression test normal service, coupon, subscription discount, free service call, duplicate submit/retry, expired subscription, invalid service ID and custom service.

Next: R2 — Subscription Payment Authority.
