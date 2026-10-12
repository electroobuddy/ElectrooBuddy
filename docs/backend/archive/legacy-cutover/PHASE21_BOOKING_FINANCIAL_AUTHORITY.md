# Phase 21 — Native Booking Financial Authority

Phase 21 moves service-booking pricing and benefit consumption to Express/PostgreSQL.

## Financial rule
A booking can receive at most one financial benefit. The server calculates the valid coupon discount and the valid subscription benefit, then selects the larger one. They never stack.

## Atomic create
`POST /api/v1/bookings` takes an idempotent request UUID. PostgreSQL takes an advisory transaction lock, re-reads the service/coupon/subscription, creates the booking, increments native coupon usage or inserts subscription benefit usage, and writes an audit event in one transaction.

## Quote
`POST /api/v1/bookings/quote` is an authenticated preview. It never consumes a coupon or subscription benefit.

## Cancellation reversal
Eligible customer/admin cancellation reverses only Phase-21 coupon consumption (`coupon_consumed_at` marker) and deletes the matching subscription benefit usage. This avoids decrementing coupon counters for older legacy bookings whose accounting semantics differed.

## Retirement
Frontend callers no longer invoke `create-service-booking`, `apply_coupon`, `public_booking_tracking`, `cancel_own_booking`, `admin_transition_booking`, `get_available_technicians`, or `notify-booking-status` for booking workflows.
