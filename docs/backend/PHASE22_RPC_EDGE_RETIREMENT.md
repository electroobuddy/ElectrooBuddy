# Phase 22 — Remaining Order/Return/Notification/Technician RPC Retirement

Phase 22 removes the final scanner-visible frontend Supabase RPC and Edge Function invocations from the Phase 21 inventory. Runtime authority for these operations now goes through the Express/PostgreSQL API.

## Retired RPC callers (12/12)

- `admin_archive_order`
- `admin_get_technicians`
- `admin_transition_order`
- `cancel_own_order`
- `create_notification_v2`
- `create_return_request`
- `get_active_coupons`
- `inspect_return`
- `mark_all_notifications_read`
- `mark_notification_read`
- `public_order_tracking`
- `review_technician_application`

## Retired Edge Function callers (9/9)

- `create-commerce-checkout`
- `create-shiprocket-order`
- `create-technician-by-admin`
- `process-return-resolution`
- `reconcile-order-refunds`
- `request-order-refund`
- `send-fcm-notification`
- `send-push-notification`
- `verify-commerce-payment`

## Native replacements

- Order transitions, archive, cancellation and public tracking use `nativeOrders`.
- Return creation, inspection and resolution use `nativeReturns`.
- Refund initiation and reconciliation use `nativeRefunds`.
- Shipment creation/testing use `nativeShipping`.
- Technician listing/creation/review use `nativeTechnician`.
- Checkout/payment verification use the Express checkout/payment endpoints.
- Notification read/create/push work is queued through the native notification outbox; an admin-only send endpoint is used for targeted push enqueueing.
- Coupon admin listing is provided by the native admin catalog repository.

## Security/authority notes

The browser no longer calls service-role-style RPC or Edge Function authorities for the Phase 22 domains. Express authentication, RBAC/permissions, PostgreSQL transactions and provider adapters remain the write authority. Notification delivery stays asynchronous through the outbox.

## Remaining shutdown work

Phase 22 intentionally does not claim full Supabase removal. Direct table/auth/storage/realtime compatibility consumers still exist elsewhere in the frontend and should be retired domain-by-domain in the final shutdown phases.
