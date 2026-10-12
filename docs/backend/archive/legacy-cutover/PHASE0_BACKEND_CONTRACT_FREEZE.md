# Phase 0 — Backend Contract & Supabase Dependency Freeze

## Outcome

Phase 0 creates a non-runtime migration baseline for an Express-first backend that can later be reimplemented in PHP without changing the frontend REST contract or requiring a database-engine migration.

No production Supabase behavior is removed in Phase 0.

## Source-derived baseline for this archive

- Frontend source files containing Supabase usage: **48**
- Distinct frontend RPC calls: **23**
- Supabase function directories: **20** including `_shared` (**19 business functions**)
- Supabase migration files: **78**

The machine-readable source of truth is `docs/backend/contracts/supabase-freeze.json`.

## Deliverables

- `ARCHITECTURE.md`
- `SECURITY_BASELINE.md`
- `POSTGRES_PORTABILITY.md`
- `API_CONTRACT_V1.md`
- `FINANCIAL_AUTHORITY_MAP.md`
- `SUPABASE_DEPENDENCY_MAP.md`
- `contracts/supabase-freeze.json`
- `tool/phase0_backend_freeze_audit.py`

## Phase 1 gate

Phase 1 may begin when:
1. freeze audit passes,
2. current build/tests are attempted and results recorded,
3. `/api/v1` response/error/idempotency conventions are accepted,
4. security and PostgreSQL portability rules are treated as mandatory.

## Phase 0 non-goals

- no Supabase removal
- no schema cutover
- no auth cutover
- no payment/fulfillment changes
- no new production endpoint yet

This isolation keeps the certified R1–R8 behavior available as the regression oracle while the replacement is built.
