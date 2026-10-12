# Phase 3 — Authentication + Session + RBAC Foundation

## Scope
Phase 3 adds a parallel, portable authentication system to the Express API. It does **not** switch the existing React/Supabase login path. Supabase remains the production authentication authority until the new flow passes database, API, security, migration and frontend-cutover validation.

## Architecture

```text
React (unchanged Supabase auth for now)

Parallel validation path:
Client -> /api/v1/auth/* -> AuthController -> AuthService -> AuthRepository -> PostgreSQL
                                            |              -> security_audit_events
                                            -> AuthDeliveryProvider -> SMTP (production)
```

The same REST contract and PostgreSQL tables can later be implemented by PHP/PDO without changing the frontend contract.

## Passwords
- New/native passwords use Argon2id.
- Minimum API policy: 12 characters, uppercase, lowercase and number.
- Plaintext passwords are never stored or logged.
- Supabase password hashes are deliberately not imported.
- Bridged Supabase users preserve their UUID and must use password reset to enable native login.

## Access tokens
- JWT access tokens use HS256 with a server-only secret of at least 32 characters.
- Default TTL: 15 minutes.
- Claims: `sub` user UUID, `sid` session UUID and current roles.
- Issuer and audience are validated.

## Refresh tokens
- Refresh tokens are 256-bit opaque random values.
- Only SHA-256 hashes are stored in PostgreSQL.
- Default TTL: 30 days.
- Every refresh rotates to a new refresh token/session row.
- Reuse of a revoked token revokes the full token family.
- Password reset revokes every active session for the user.

## Session tables
Migration `002_auth_sessions_rbac.sql` adds:
- `auth_sessions`
- `password_reset_tokens`
- `email_verification_tokens`
- `security_audit_events`

It also extends `users` with login-lock/password-migration state.

## Account lock protection
Five failed password attempts trigger a 15-minute database-level account lock. This complements API/IP auth rate limiting.

## Email verification
- Verification tokens are opaque random values stored only as hashes.
- Old outstanding verification tokens are consumed when a new one is issued.
- Verifying an email can never reactivate a disabled account.
- Production requires SMTP delivery; token logging is rejected in production configuration.

## Password reset
- Public reset-request responses are non-enumerating (`accepted: true`).
- Tokens are single-use and expire (default 30 minutes).
- Completion sets an Argon2id password, enables native login and revokes all sessions.

## RBAC
Portable roles remain:
- `user`
- `technician`
- `admin`

`src/auth/permissions.ts` defines stable permission names and role-to-permission mapping. Express middleware provides:
- `authenticate(env)`
- `requireRole(...)`
- `requirePermission(...)`

Authorization stays in the API layer rather than PostgreSQL RLS, keeping future PHP compatibility.

## Security audit events
Authentication/security events use an append-only event table separate from ordinary CRUD audit rows. Events include login success/failure/block, refresh reuse, logout, password reset and email verification. Raw passwords/tokens are not placed in audit metadata.

## Supabase user bridge
`npm run auth:import-supabase -- --file=/path/users.json` performs a dry run.

Apply only after review:

```bash
npm run auth:import-supabase -- --file=/path/users.json --apply
```

The bridge:
- preserves `auth.users.id` UUID values;
- imports email/verification/creation metadata;
- does not import password hashes;
- sets `auth_source='supabase'`;
- leaves `native_login_enabled=false` until password reset.

## No frontend cutover
There are intentionally no changes to `src/integrations/supabase`, `useAuth`, or existing login UI in Phase 3.
