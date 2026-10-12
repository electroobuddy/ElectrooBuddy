# Final Production QA + Lighthouse + Security Regression Audit

## Final source repairs completed
- Removed the remaining live `select("*")` calls (0 remain in `src`).
- Removed the obsolete `DebugRoles` page and notification test/legacy files.
- Removed remaining OneSignal runtime references; Firebase/FCM is the single push path.
- Fixed broken OneSignal imports left by the earlier consolidation and restored FCM setup.
- Removed legacy `create-technician` Edge Function; only the admin-authorized implementation remains.
- Removed technician self-role creation from `TechnicianProfile`; pending applications cannot grant themselves technician role.
- Removed hardcoded fallback technician/Shiprocket passwords.
- Moved Shiprocket credentials fully to `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` Edge secrets.
- Added admin-only server-side Shiprocket connection testing.
- Fixed a historical RLS policy that exposed `shipping_settings` to every authenticated user; browser access is admin-only and credential columns are revoked.
- Replaced AdminTechnicians and AdminBookings technician-count N+1 queries with grouped RPCs.
- Hardened database metrics RPCs with internal admin authorization while keeping the admin dashboard functional.
- Removed browser access to `get_admin_users`; new-booking admin in-app notifications are now created by a DB trigger.
- Hardened `create_notification_v2` to self-target or admin-target only.
- Hardened `mark_all_notifications_read` so users cannot mark another user's notifications.
- Added atomic inventory reservation to server-authoritative checkout.
- Added automatic inventory restoration when an order is cancelled.
- Added 20-minute expiry/release for abandoned Razorpay checkout reservations.
- Razorpay verification rejects expired/released checkout sessions.
- Refreshed `package-lock.json` from the final `package.json`.
- Added `tool/final_production_qa.ps1` for Windows release verification.

## Static regression results
PASS: 0 live `select("*")` calls in `src`.
PASS: 0 browser-side `payment_status: "paid"` writes in Checkout.
PASS: 0 technician self-role assignment literals in technician pages.
PASS: no `Buddy@123` hardcoded fallback remains.
PASS: no active OneSignal runtime references remain.
PASS: legacy unaudited `create-technician` Edge Function removed.
PASS: local source imports resolve to existing project files.
PASS: Razorpay subscription webhook verifies `x-razorpay-signature` using HMAC.

## Build / Lighthouse status
`package-lock.json` regeneration passed.
A clean dependency installation was attempted in this environment but exceeded the execution window, so a successful Vite build, Vitest run, ESLint pass, and browser Lighthouse run are NOT claimed here.

Run on the release machine:
`powershell -ExecutionPolicy Bypass -File tool/final_production_qa.ps1`

Then run Lighthouse against a preview deployment. Existing `lighthouserc.json` budgets remain the release gate.

## Required deployment order
1. Apply all pending migrations through `20260923_final_qa_hardening.sql`.
2. Ensure Edge secrets exist: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `INTERNAL_FUNCTION_SECRET`, `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, plus Firebase server credentials already required by FCM.
3. Deploy the updated Edge Functions, especially commerce checkout/payment verification, Shiprocket, booking notifications and FCM.
4. Run the local final QA PowerShell script.
5. Deploy a preview frontend and exercise login, technician approval, booking, COD checkout, Razorpay success/failure, cancellation/restock, admin notifications, FCM opt-in, image upload and Shiprocket test.
6. Inspect browser console for CSP violations and network failures.
7. Run Lighthouse against preview and fix any budget failure before production.
8. Deploy production only after the preview regression pass.

## Manual payment cases that must be exercised
- COD order decrements stock once.
- Razorpay order reserves stock, successful verification marks paid once, replay is idempotent.
- Abandoned Razorpay checkout releases stock after 20 minutes when checkout cleanup next runs.
- Cancelled reserved order restores stock once.
- Invalid/tampered Razorpay signature cannot mark an order paid.
- A user cannot verify another user's order.

## Release status
Source-level security/performance regression audit: PASS with the fixes above.
Production build/browser/Lighthouse gate: PENDING local/preview execution because dependencies/browser execution are unavailable in this sandbox.
