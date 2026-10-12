# Phase 3 Security Model

## Trust boundaries
The browser is untrusted. Identity is derived only from a verified access token. User IDs, roles or permissions supplied in request bodies are never authoritative.

## Secret handling
Server-only secrets include JWT keys, PostgreSQL credentials and SMTP credentials. Production environment validation rejects development token-log delivery mode.

## Token storage
Access JWTs are not persisted by the server. Refresh/reset/verification secrets are never stored plaintext; only SHA-256 token digests are persisted. Authenticated requests also confirm the referenced session is active and reload current roles, so logout and role revocation take effect immediately.

## Replay and rotation
A refresh token is single-use. Rotation is serialized with `SELECT ... FOR UPDATE`. Reuse of a previously rotated/revoked token revokes the entire token family, and that revocation is committed before the API returns an error.

## Password protection
Argon2id parameters are explicit in code. Login responses use a generic invalid-credentials response. Reset request responses do not disclose whether an email exists.

## Authorization
Authentication, role and permission checks are separate middleware. Services must still enforce resource ownership for object-level access; RBAC alone is not a substitute for ownership checks.

## Audit
Security audit metadata must never contain passwords, raw refresh tokens, reset tokens, verification tokens, JWTs or provider secrets.

## Cutover gate
Do not switch frontend authentication until all of the following pass against Neon staging:
1. migrations 001 + 002;
2. register/verify/login;
3. refresh rotation and reuse detection;
4. logout and logout-all;
5. password reset and session revocation;
6. admin/technician/user role middleware;
7. Supabase UUID bridge dry-run and sample import;
8. negative/security tests;
9. frontend dual-auth staging validation.
