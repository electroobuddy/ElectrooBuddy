# Phase 1 — Express API Foundation

## Status

Implemented as an additive backend foundation. Existing Supabase runtime domains remain untouched.

## Runtime architecture

```text
HTTP -> Express route -> controller -> service -> repository/provider -> PostgreSQL/external provider
```

The boundary is intentionally compatible with a future PHP implementation: `/api/v1`, JSON envelopes, PostgreSQL schema, stable error codes, and provider responsibilities are not Express-specific.

## Implemented

- independent `server/` package using TypeScript and Express
- Zod-based strict environment parsing before server startup
- standard `pg` PostgreSQL client compatible with Neon and normal PostgreSQL
- bounded PostgreSQL pool and TLS option
- `GET /api/v1/health` process liveness endpoint
- `GET /api/v1/ready` dependency readiness endpoint
- Helmet security headers and disabled Express fingerprint header
- explicit credential-aware CORS allowlist; wildcard rejected by env validation
- global rate limiting
- request body limits
- request/correlation IDs
- Pino/Pino-HTTP structured logging and sensitive-value redaction
- centralized stable JSON errors
- graceful SIGTERM/SIGINT shutdown and DB pool close
- controller/service/repository separation demonstrated by the system health domain
- provider interfaces for payment, storage, shipping, and push
- API foundation tests for liveness, readiness, safe readiness failure, 404 contract, request IDs, and CORS
- Phase 1 static audit command

## Non-goals / intentionally deferred

No Supabase domain was cut over in Phase 1. No customer, order, payment, booking, subscription, technician, storage, or admin route uses this server yet. No canonical application schema is introduced yet; that begins in Phase 2.

JWT/authentication, RBAC implementations, per-route financial rate limits, webhook implementations, Razorpay, Shiprocket, Firebase provider implementations, object storage provider implementation, and domain-specific validation are later phases.

## Security decisions

1. `DATABASE_URL` exists only server-side.
2. CORS uses exact configured origins and rejects `*` in configuration.
3. Error responses never send raw PostgreSQL errors or stack traces.
4. Request IDs are returned to clients and attached to logs.
5. Logs redact authorization, cookies, API keys, passwords, tokens and refresh tokens.
6. `/health` is a liveness endpoint and deliberately does not touch PostgreSQL.
7. `/ready` verifies PostgreSQL but returns only a stable `SERVICE_NOT_READY` error if the DB is unavailable.
8. Request bodies are bounded before domain routes are added.
9. Database connections use a finite pool and configurable TLS suitable for Neon.
10. Provider interfaces prevent Razorpay/Shiprocket/FCM/storage SDKs from leaking into domain services.

## Local commands

```bash
npm install --prefix server
npm run server:dev
npm run server:test
npm run server:build
npm run audit:backend-phase1
npm run audit:backend-freeze
```

## Phase 1 exit gate

- Phase 1 static audit passes.
- Phase 0 Supabase freeze still passes, proving current migration baseline was not silently changed.
- Server typecheck/tests/build pass once dependencies are installed.
- No frontend API cutover is performed during this phase.
