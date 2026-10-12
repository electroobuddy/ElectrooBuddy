# Phase 8 — Service Booking APIs

Phase 8 migrates standard authenticated booking creation, own-booking reads/cancellation, secure token tracking, technician assignment, and controlled booking transitions to Express/PostgreSQL.

## Financial boundary
Coupon-backed and subscription-benefit bookings intentionally remain on the existing certified Supabase `create-service-booking` authority until coupon/subscription ledgers migrate. `src/lib/serviceBooking.ts` automatically selects the legacy authority whenever those benefits are requested. Payment/refund/subscription purchase authority is untouched.

## Feature gate
`VITE_BOOKING_BACKEND=supabase` and `VITE_BOOKING_WRITE_BACKEND=supabase` are production-safe defaults. Express writes require both flags to be `express`, are staging-only in Phase 8, and must not be enabled in production until coupon/subscription booking ledgers and all booking consumers have migrated.

## Express endpoints
- `POST /api/v1/bookings`
- `GET /api/v1/bookings`
- `GET /api/v1/bookings/:id`
- `POST /api/v1/bookings/:id/cancel`
- `POST /api/v1/booking-tracking/lookup`
- admin assignment/transition routes
- technician booking list/transition routes

## Safety
Service price is read from PostgreSQL. Tracking tokens are random and only SHA-256 hashes are stored. Customer cancellation is ownership scoped and state constrained. Technician transitions are restricted to the assigned technician and to `in_progress`/`completed`.

## Data migration

```bash
npm run booking:sync-source
npm run booking:sync-source -- --apply
npm run booking:verify-parity
```

## Recommended Phase 8 staging flags

```env
VITE_AUTH_BACKEND=hybrid
VITE_BOOKING_BACKEND=express
VITE_BOOKING_WRITE_BACKEND=supabase
```

This validates native reads/tracking/technician workflows while all new booking writes still land in Supabase. Express writes are implemented for certification but remain an explicit later cutover.
