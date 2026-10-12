# ElectrooBuddy Backend Target Architecture (Phase 0 Freeze)

Status: **FROZEN FOR PHASE 1 IMPLEMENTATION**
Contract version: **v1**
Primary target: **Express + TypeScript + PostgreSQL (Neon)**
Future target: **PHP + PDO PostgreSQL on VPS without frontend contract changes**

## 1. Boundary

The browser is a presentation client. It must never be a financial, authorization, inventory, refund, return, subscription, or fulfillment authority.

```text
React/Vite
   |
   | HTTPS JSON /api/v1
   v
Express API (initial) --------------------------+
   |                                            |
   +--> Auth / RBAC / validation                +--> provider adapters
   +--> domain services                         |    Razorpay
   +--> transaction services                    |    Shiprocket
   +--> repositories                            |    Firebase FCM
   |                                            |    Object storage
   v                                            |
PostgreSQL (Neon initially) <-------------------+
```

Future cutover:

```text
React/Vite -> SAME /api/v1 contract -> PHP API -> SAME portable PostgreSQL schema
```

## 2. Layer rules

### HTTP layer
- Routes contain no SQL and no business arithmetic.
- Controllers parse validated inputs and translate service results to the frozen response envelope.
- No endpoint may accept a client-supplied `user_id` as authentication authority.

### Service layer
- Owns business rules and state transitions.
- Financial and stock mutations run inside explicit PostgreSQL transactions.
- Critical resources use row locks (`SELECT ... FOR UPDATE`) or equivalent safe atomic SQL.
- Provider calls are wrapped by dedicated adapters.

### Repository layer
- All persistence is behind domain repositories.
- Repositories receive an explicit transaction/client when participating in a transaction.
- PostgreSQL-specific SQL is allowed; Neon-specific business dependencies are not.

### Provider layer
Required interfaces:
- `PaymentGateway` -> Razorpay initially.
- `ShippingProvider` -> Shiprocket initially.
- `PushProvider` -> Firebase FCM initially.
- `ObjectStorageProvider` -> Neon Object Storage/S3-compatible initially.
- `EmailProvider` -> implementation selected in Phase 1/notification phase.

## 3. Versioning

All application routes begin with `/api/v1`.

Breaking changes require `/api/v2`; implementation language changes do not.

## 4. Identity model

The API owns authentication independently of Supabase:
- `users`
- `roles`
- `user_roles`
- `auth_sessions`
- `password_reset_tokens`
- optional email-verification tokens

Access token: short-lived JWT.
Refresh token: opaque random token; only a hash is stored server-side; rotate on refresh.

Roles currently required:
- `customer`
- `technician`
- `admin`
- `super_admin` (reserved for explicit privileged operations)

Authorization is deny-by-default.

## 5. Data ownership

Server-authoritative values include, at minimum:
- product/service price
- installation charges
- shipping and tax
- discounts/coupon applicability
- inventory availability/reservation
- subscription entitlement and benefit consumption
- Razorpay order/payment/refund status
- refundable amount
- booking/order state transitions
- return eligibility and accepted quantities
- fulfillment state

Client values in these areas are hints/display state only and must be reloaded/recomputed server-side.

## 6. Storage

Database rows store storage metadata/keys, not provider credentials.

Application code calls `ObjectStorageProvider`; no controller or domain service imports a Neon/S3 SDK directly.

Suggested object key shape:
`<domain>/<yyyy>/<mm>/<uuid>.<safe-extension>`

## 7. Background work

Long-running/retryable operations use a database-backed job/outbox model rather than local filesystem state. Jobs must be idempotent and safe for duplicate execution.

Initial required jobs:
- expired checkout release
- fulfillment processing/retry
- refund reconciliation
- push/email delivery where asynchronous

## 8. Migration rule

During migration, Supabase remains a reference/legacy backend. A domain is cut over only after:
1. its API contract is implemented,
2. data migration is verified,
3. regression/invariant tests pass,
4. frontend calls only `/api/v1`, and
5. rollback path is documented.
