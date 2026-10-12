# A5.2 Guest booking design — requires DB-schema validation

The current `/bookings/quote` and `/bookings` require access tokens. `BookingController` dereferences `req.auth!.userId`; `BookingService.financialQuote` uses that ID for coupon and subscription eligibility and `BookingRepository.createFinancial` stores it. Simply removing route authentication would be unsafe and cause runtime errors.

Proposed API:
- POST `/api/v1/guest-bookings/quote`: service ID / custom-service demand only. Return server-calculated public visit charge; do not accept coupon/subscription use.
- POST `/api/v1/guest-bookings`: strict validated contact info + service/date/time + UUID idempotency key. Recompute price from server catalog, never trust browser total/price. Rate-limit tighter than authenticated operations, add CAPTCHA/server-side bot token verification and spam heuristics. Do not allow user/subscription/coupon fields.
- On creation store `customer_user_id=NULL` ONLY after checking the actual booking schema, foreign keys, views, constraints, row security, indexes and worker assumptions. Introduce a separate guest bookings table or nullable ownership with a controlled migration.
- Store SHA-256 of 32-byte random tracking token. Return raw token only once. Idempotent retries need a deliberate token-recovery flow (e.g., verified email/OTP), not a public token by requestId alone.
- Guest access: tracking by high-entropy opaque token; no list-by-email/phone APIs. Retain authentication for `/bookings` list/cancel and admin routes. Guest cancellation requires verified ownership (OTP or scoped one-time token).
- Admin assignment and ops must handle the guest customer shape without assuming a user ID.
- If visit charges are payable, payment creation/capture must be linked to guest booking and server amount; do not mark paid from client input.
- Guest confirmation via email/WhatsApp should be implemented asynchronously; credentials remain server-side.

Regression gate: unauthorized customer must not read/modify other booking, replay must not duplicate, guest coupon/subscription flags rejected, invalid CAPTCHA rejected, tracking brute-force rate limited, sanitization/PII redaction, concurrent idempotency, DB migration rollback, production booking/notification worker contract tests.
