# ElectrooBuddy REST Contract v1

This document freezes names, response envelopes and authority boundaries. Phase 1 may add fields/endpoints without breaking these rules.

Base path: `/api/v1`
Content type: `application/json` except upload endpoints.

## Response envelopes

Success:
```json
{"success":true,"data":{}}
```

Paginated success:
```json
{"success":true,"data":[],"meta":{"page":1,"limit":20,"total":0,"pages":0}}
```

Failure:
```json
{"success":false,"error":{"code":"STABLE_CODE","message":"Safe message"}}
```

Validation failure may add `error.fields`.

Each response should carry/request a correlation id (`X-Request-Id`).

## Idempotency

Sensitive create/transition endpoints accept `Idempotency-Key` where duplicate execution could create financial, inventory, subscription, fulfillment or notification side effects.

At minimum:
- checkout creation
- subscription order creation
- refund request/admin refund
- return resolution/replacement
- trusted fulfillment enqueue/process operations

The server stores the idempotency key scoped to actor + operation and returns the original outcome for safe retries.

## Endpoint groups frozen for implementation

### System
- `GET /health`
- `GET /ready`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Catalog/public content
- `GET /products`
- `GET /products/:idOrSlug`
- `GET /product-categories`
- `GET /services`
- `GET /services/:idOrSlug`
- `GET /offers/active`
- `GET /projects`
- `GET /testimonials`
- `GET /team`
- `GET /site-settings/public`

### Customer profile/address
- `GET /users/me`
- `PATCH /users/me`
- `GET /users/me/addresses`
- `POST /users/me/addresses`
- `PATCH /users/me/addresses/:id`
- `DELETE /users/me/addresses/:id`

### Cart/wishlist
- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:id`
- `DELETE /cart/items/:id`
- `DELETE /cart`
- `GET /wishlist`
- `POST /wishlist/:productId`
- `DELETE /wishlist/:productId`

### Pricing/checkout
- `POST /checkout/quote`
- `POST /coupons/validate`
- `POST /checkout`
- `POST /payments/razorpay/verify`
- `POST /webhooks/razorpay`

### Orders
- `GET /orders`
- `GET /orders/:id`
- `POST /orders/:id/cancel`
- `POST /orders/:id/refunds`
- `GET /orders/tracking/:token`

### Returns
- `POST /orders/:id/returns`
- `GET /returns/:id`

### Bookings
- `POST /bookings`
- `GET /bookings`
- `GET /bookings/:id`
- `POST /bookings/:id/cancel`
- `GET /bookings/tracking/:token`

### Technician
- `POST /technician/register`
- `GET /technician/profile`
- `PATCH /technician/profile`
- `GET /technician/bookings`
- `GET /technician/bookings/:id`
- `POST /technician/bookings/:id/accept`
- `POST /technician/bookings/:id/start`
- `POST /technician/bookings/:id/complete`

### Subscriptions
- `GET /subscription-plans`
- `POST /subscriptions/orders`
- `POST /subscriptions/payments/verify`
- `GET /subscriptions/me`
- `GET /subscriptions/me/benefits`
- `POST /webhooks/razorpay/subscriptions`

### Notifications
- `GET /notifications`
- `POST /notifications/:id/read`
- `POST /notifications/read-all`
- `GET /notification-preferences`
- `PATCH /notification-preferences`
- `POST /push-subscriptions`
- `DELETE /push-subscriptions/:id`

### Public forms
- `POST /contact`
- `POST /newsletter/subscribe`

### Uploads
- `POST /admin/uploads/images`
- `DELETE /admin/uploads/:id`

### Admin
- `GET /admin/dashboard`
- CRUD/controlled management endpoints for products, categories, services, offers, coupons, projects, testimonials, team, settings and subscribers.
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `POST /admin/orders/:id/transition`
- `POST /admin/orders/:id/archive`
- `GET /admin/bookings`
- `POST /admin/bookings/:id/transition`
- `POST /admin/bookings/:id/assign-technician`
- `GET /admin/technicians`
- `POST /admin/technicians/:id/review`
- `GET /admin/refunds`
- `POST /admin/refunds/:id/reconcile`
- `POST /admin/orders/:id/refunds`
- `GET /admin/returns`
- `POST /admin/returns/:id/inspect`
- `POST /admin/returns/:id/resolve`
- `GET /admin/subscriptions`
- `GET /admin/financial-integrity`

### Provider/trusted internal
- `POST /webhooks/shiprocket`
- trusted scheduler/worker routes are not public API and must require an internal service credential or run as a worker process.

## Forbidden generic mutations

Do not implement generic endpoints allowing arbitrary fields for:
- order financial/payment/status authority
- booking controlled status transitions
- refunds
- returns/accepted quantities
- subscription activation/benefit consumption
- inventory/coupon counters

Use explicit commands/actions with state-machine validation.
