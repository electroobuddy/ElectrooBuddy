# Financial / State Authority Freeze

These behaviors exist in the certified Supabase implementation and are acceptance criteria for the Express replacement.

| Domain | Frozen authority/invariant | Express target |
|---|---|---|
| Service booking | Reload service title/charge server-side; validate coupon/subscription; idempotent booking request | `BookingService.create()` transaction |
| Subscription order | Browser plan price is not authority | `SubscriptionCheckoutService` |
| Subscription activation | Verify Razorpay signature + provider payment; prevent payment reuse; atomic activation | `SubscriptionPaymentService` transaction |
| Product checkout | Product price/stock/install availability/charge server-side | `CheckoutService` |
| Checkout retry | Per-user request id/idempotency prevents duplicate stock reservation | Idempotency repository + transaction |
| Inventory | Serialize last-stock races; release expired reservation | inventory rows + row locks/reservations |
| Coupons | Serialize global/per-user limits and reservation/consumption | coupon row lock + usage ledger |
| Commerce payment | Verify HMAC, provider order/payment, amount/currency/status; exactly one pending→paid transition | `PaymentService.verifyCommercePayment()` |
| Fulfillment | Persist queue; Shiprocket creation idempotent; webhook idempotent | DB job/outbox + `ShippingProvider` |
| Tracking | Opaque raw token returned once; only SHA-256 hash persisted | tracking token service |
| Cancellation | Unpaid/unshipped customer cancellation constrained; paid cancellation goes through refund authority | explicit cancellation service |
| Refund | Durable ledger; amount <= captured-unrefunded; duplicate-safe; provider transitions finalized centrally | `RefundService` |
| Refund side effects | Restock/coupon reversal only after confirmed full pre-shipment refund; partial refund does not restock | domain transaction/state machine |
| Return | 7-day delivered eligibility and quantity-level over-return prevention | `ReturnService.request()` |
| Physical restock | Only accepted physical quantity increases inventory; double inspection prevented | inspection transaction + counters |
| RTO | RTO webhook creates/syncs record but never auto-refunds/restocks | explicit ops resolution |
| Admin transitions | No arbitrary direct order/booking status writes | command endpoints + transition maps |
| Integrity reporting | impossible financial/fulfillment states detectable before release | `/admin/financial-integrity` + SQL checks |

## Required negative tests

- stale browser price
- forged user/role/id ownership
- duplicate checkout and duplicate payment callback
- last-stock two-request race
- final coupon-slot race
- wrong Razorpay amount/currency/order/signature
- payment after checkout expiry
- duplicate refund and concurrent full refund
- partial refund attempting stock restore
- shipped order direct cancellation
- duplicate return / over-return
- double physical inspection
- duplicate Shiprocket/Razorpay webhook
- subscription payment reuse and benefit double-consumption
