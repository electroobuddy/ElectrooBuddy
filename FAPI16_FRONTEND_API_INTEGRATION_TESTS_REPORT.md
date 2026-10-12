# FAPI-16 — Frontend/API Integration Tests

## Status

Static integration-test certification: **PASS**.

Runtime Vitest execution in this handoff environment: **PENDING** because `npm ci` timed out before the Vitest binary was installed. The suite is wired to `npm run test:integration` and `npm run certify:fapi16` for local/CI execution after a successful dependency install.

## Added integration coverage

Six contract-level integration suites exercise the real frontend API wrappers and session/cache behavior without mutating a live production backend:

1. `authSession.integration.test.ts`
   - login access-token persistence
   - authenticated Authorization header
   - 401 → refresh → single retry
   - logout token cleanup

2. `bookingApi.integration.test.ts`
   - server booking quote endpoint
   - booking creation payload preservation
   - technician transition endpoint
   - admin transition endpoint

3. `checkoutPostPurchase.integration.test.ts`
   - checkout `Idempotency-Key`
   - Razorpay verification contract
   - post-purchase lifecycle endpoint
   - secure order tracking
   - stable refund idempotency key
   - stable return idempotency key

4. `technicianNotifications.integration.test.ts`
   - technician application/dashboard authority
   - technician self-profile PATCH
   - notification preferences
   - FCM subscribe/unsubscribe
   - retrying the existing notification outbox row

5. `sessionIsolation.integration.test.ts`
   - private TanStack Query cache removal while public cache survives
   - FCM token ownership per authenticated user
   - logout cleanup only for the owning account

6. `adminOperations.integration.test.ts`
   - operations health endpoint
   - legal admin order transition contract
   - return inspection/resolution endpoints
   - notification outbox processing endpoint

## Commands

```powershell
npm run audit:fapi16
npm run test:integration
npm run certify:fapi16
```

## Validation performed here

- FAPI-16 structural audit: **49/49 PASS**
- New integration-test TypeScript transpile: **6/6 PASS**
- FAPI-1 through FAPI-15 regression gates: **PASS**
- Phase 24 zero-Supabase production audit: **PASS**
- Phase 29 launch-readiness audit: **43/43 PASS**

## Runtime validation boundary

`npm ci --ignore-scripts --no-audit --no-fund` was attempted, but registry/dependency installation timed out before `node_modules/.bin/vitest` became available. Therefore no claim is made that the runtime Vitest suite executed in this environment.

After dependency installation succeeds, run:

```powershell
npm ci
npm run certify:fapi16
npm run build
```
