# Phase 21 Remaining Supabase Inventory

Scanner-visible frontend Supabase consumers: **45** (Phase 0 baseline 67).
Distinct frontend RPCs: **12** (Phase 0 baseline 23).
Frontend Edge Function invocations: **9**.

Booking-specific RPC/Edge callers retired in Phase 21 include `apply_coupon`, `create-service-booking`, `public_booking_tracking`, `cancel_own_booking`, `admin_transition_booking`, `get_available_technicians`, and `notify-booking-status`.

Remaining RPCs are primarily order/return/notification/technician/coupon-admin legacy fallbacks and should be retired only with their corresponding authority and rollback certification.
