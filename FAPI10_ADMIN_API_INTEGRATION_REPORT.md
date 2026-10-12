# FAPI-10 — Admin API Integration

## Completed

- Removed obsolete frontend backend-selection flags from native booking/order/refund/return/shipping/technician/notification wrappers. Express is the only supported runtime authority.
- Restricted Admin Orders generic state transitions to the server-supported `confirmed`, `processing`, and `cancelled` targets. Shipping/delivery remain under the fulfillment workflow.
- Typed Admin Orders against `NativeOrder`/`NativeOrderItem`/`ShippingAddressData`.
- Typed Admin Bookings against `NativeBooking` and `NativeTechnician`.
- Admin booking status, assignment and unassignment now refetch the authoritative booking before updating the open detail drawer.
- Admin Payments now uses `NativeOrder` and `NativeRefund` contracts.
- Admin refund requests keep a stable idempotency key across uncertain retries and clear it only after confirmed success.
- Reworked Returns/RTO worklist to typed `NativeReturn`/`NativeReturnItem` data with validation and explicit refresh.
- Typed fulfillment operations and replacement jobs.

## Validation

`npm run audit:fapi10` => 13/13 PASS.

Modified TypeScript/TSX transpile check => 13/13 PASS.

Prior FAPI audit scripts were rerun where present and remained passing.
