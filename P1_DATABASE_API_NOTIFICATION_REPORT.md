# P1 — Database/API Efficiency & Notification Architecture Cleanup

## Implemented
- Replaced BookingDetails technician N+1 query with one grouped `get_available_technicians(date)` RPC.
- Added indexes for booking assignment/date, booking status/time, order user/time, notification user/read/time, push subscription user/active, product active/featured/time, and service sort order.
- Reduced central data-hook `select("*")` usage for projects, orders, bookings, products, profiles, roles and contact messages.
- Converted count/head queries from `select("*")` to `select("id")`.
- Added shared Edge Function authorization helpers.
- Hardened `notify-booking-status` to admin or the assigned approved technician.
- Hardened `auto-assign-technician` to admin callers.
- Hardened direct FCM/email notification endpoints to admin or authenticated internal function calls.
- Added `INTERNAL_FUNCTION_SECRET` for function-to-function notification calls.
- Removed private-key prefix/suffix debug logging from FCM.
- Consolidated production push architecture on Firebase/FCM.
- Removed duplicate `send-push-notification` and OneSignal Edge endpoints.
- Removed production OneSignal/test routes; legacy client files are quarantined with `.legacy`.
- Routed frontend TS/TSX diagnostics through a DEV-only logger.
- Removed verified-unused runtime dependency declarations: @hookform/resolvers, date-fns, dotenv, web-push, zod.
- Removed 17 unreferenced original raster files after WebP replacements, saving about 4.96 MB from the source package.
- Added Lighthouse CI performance budgets and `audit:bundle` / `audit:lighthouse` scripts.

## Deployment requirements
1. Apply `supabase/migrations/20260921_p1_database_api_efficiency.sql`.
2. Set a strong random Supabase Edge secret named `INTERNAL_FUNCTION_SECRET`.
3. Deploy `notify-booking-status`, `send-fcm-notification`, `send-notification-email`, and `auto-assign-technician` together.
4. Deploy the frontend after those functions.
5. OneSignal is intentionally no longer part of the production path.

## Validation
A full dependency-backed Vite build is still blocked in this execution environment because the materialized project does not have usable node_modules binaries and npm dependency installation cannot complete in the execution window.
Run locally:
- `npm install` (package.json changed; regenerate package-lock.json)
- `npm run build`
- `npm run lint`
- `npm run audit:bundle`
- `npx @lhci/cli autorun`

## Remaining P1 observations
There are 37 `select("*")` calls left in feature/admin/detail screens. These are not in the primary homepage hot path; P2/final QA should narrow them while validating exact UI field requirements rather than blindly removing columns.
The Razorpay subscription webhook is intentionally unauthenticated by user JWT; it verifies `x-razorpay-signature` with HMAC before privileged processing.

## Next automatic phase
P2 — XSS, Input Validation & Production Hardening:
DOM/HTML sinks, URL/link sanitization, invoice/print escaping, JSON-LD escaping, form schemas and length limits, upload MIME/size validation, security headers/CSP, rate limiting/anti-spam, and final RLS/input-boundary review.
