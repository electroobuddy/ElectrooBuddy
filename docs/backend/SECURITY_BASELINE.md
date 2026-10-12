# Backend Security Baseline

This baseline is mandatory for Express and must be preserved by a later PHP implementation.

## Trust boundaries

- Treat every browser/mobile request as hostile input.
- Trust identity only after token/session verification.
- Never expose database, Razorpay, Shiprocket, Firebase-admin, object-storage, or signing secrets to Vite/client environment variables.
- Never use a service/database superuser credential in the frontend.

## Authentication

- Password hashing: Argon2id preferred; bcrypt allowed only with an explicitly reviewed work factor.
- Access JWTs are short-lived and contain only minimum identity/authorization claims.
- Refresh tokens are cryptographically random, hashed at rest, rotated on refresh, and revocable.
- Logout revokes the current session; logout-all revokes every refresh session for the account.
- Password reset tokens are single-use, hashed at rest, and expire.
- Do not leak whether an email exists in forgot-password responses.

## Authorization

- Deny by default.
- Separate authentication from role/permission checks.
- Enforce object ownership server-side from authenticated identity.
- Admin routes require explicit role/permission checks; UI visibility is not authorization.
- Technician access is restricted to assigned/eligible records.
- Never accept `user_id`, `role`, `is_admin`, `payment_status`, or authoritative state directly from the browser.

## Input validation

- Validate params, query and body using strict schemas (Zod in Express target).
- Reject unknown fields on sensitive write endpoints.
- Apply explicit length/range/enum constraints.
- Normalize emails and identifiers consistently.
- Use parameterized SQL only.

## HTTP controls

- HTTPS only in production.
- Strict allow-list CORS; never wildcard credentials.
- `helmet`/equivalent security headers.
- Request body limits; smaller limits for JSON, separately controlled multipart limits.
- Rate limits by endpoint class plus account/IP signals.
- Login, reset, public tracking and contact endpoints receive tighter abuse controls.
- Sensitive responses set `Cache-Control: no-store`.

## Financial and stock integrity

- All quote totals are recomputed server-side.
- Use integer minor units at API/provider boundaries where practical; PostgreSQL money fields use `NUMERIC`, never float.
- Checkout, coupon, inventory, payment activation, refund finalization, subscription benefit consumption and accepted-return restocking are transactional.
- Critical races use row locks/unique constraints/idempotency keys.
- Provider callbacks never directly trust browser-reported success.
- Payment/refund/webhook signatures use constant-time comparison.
- Verify Razorpay amount, currency, provider order/payment/refund identifiers, and expected internal state.

## Webhooks

- Preserve raw request body where provider signature verification requires it.
- Verify signature before parsing into trusted events.
- Persist provider event id/fingerprint and enforce idempotency.
- Reject stale/replayed events when provider semantics allow.
- Webhooks call the same domain transition service as other trusted server paths.

## Public tracking

- Tracking uses high-entropy opaque tokens.
- Store only SHA-256 token hash where possible.
- Do not expose sequential internal IDs as the sole credential.
- Rate limit tracking lookups.

## File uploads

- Upload authorization is server-side.
- Allow-list MIME/extension by domain.
- Verify magic bytes, not just filename/content-type.
- Randomize object keys; never use user paths directly.
- Size limits are mandatory.
- Prefer image re-encoding/metadata stripping before public delivery.
- Store only required public metadata in DB.
- Storage write credentials remain server-side.

## Logging and privacy

Never log:
- passwords or reset tokens
- access/refresh tokens
- provider secrets/signatures
- full payment credentials
- database URLs

Structured logs should contain correlation/request id, actor id where known, action, entity, outcome and safe error code.

Security/audit logs are append-oriented and protected from ordinary application users.

## Database

- Application DB role follows least privilege and is not the cluster owner/superuser.
- Foreign keys, checks, unique constraints and NOT NULL constraints enforce invariants in addition to service validation.
- Production migrations use a separate migration role/process if feasible.
- TLS is required to Neon/remote PostgreSQL.
- Backups/restore tests are required before production cutover.

## Secrets

Required separation:
- local development `.env`
- Render staging secrets
- Render production secrets

`.env` files must never be committed. Provide `.env.example` with names only.

## Error handling

External errors use stable codes and safe messages. Production responses never expose SQL, stack traces, filesystem paths, secret configuration or provider raw secrets.
