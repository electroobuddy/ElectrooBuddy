# Phase 13 — Native Order + Admin Payment Operations

## Scope
Phase 13 moves order read authority and safe non-refund order operations from Supabase to Express/PostgreSQL while preserving the existing REST/frontend contract boundary.

### Native Express operations
- Customer own-order list/detail and order-success lookup.
- Secure public tracking by opaque token hash; order numbers alone reveal nothing.
- Customer cancellation for eligible unpaid/unshipped orders.
- Admin order list/detail, controlled `pending -> confirmed -> processing`, safe cancellation, and terminal archive.
- Admin payment operations read model, including PostgreSQL refund rows.

### Deliberately retained legacy authority
- Razorpay refunds and refund reconciliation.
- Return/replacement workflows.
- Shiprocket order creation and fulfillment mutation.

These remain on the certified legacy authority until their dedicated cutover phases.

## Cancellation invariants
Cancellation runs in one PostgreSQL transaction and locks the order first. It rejects paid Razorpay orders, active Shiprocket shipments, and in-flight/delivered fulfillment. If native checkout inventory is still reserved, quantities are restored exactly once and `inventory_released_at` is set. Coupon reservations are released and consumed COD coupon usage is decremented exactly once before the order enters `cancelled`.

## Feature gate
Frontend defaults to the existing backend:

```env
VITE_ORDER_BACKEND=supabase
```

Staging can switch to:

```env
VITE_ORDER_BACKEND=express
```

Native auth must already be available for customer/admin authenticated endpoints.
