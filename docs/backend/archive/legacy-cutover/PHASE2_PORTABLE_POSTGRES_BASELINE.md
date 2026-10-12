# Phase 2 — Portable PostgreSQL Baseline

## Status

Phase 2 creates the clean-target PostgreSQL schema for the Express/Neon backend without cutting any frontend runtime path away from Supabase.

The source-of-truth inputs are the 78 migration-directory artifacts (77 executable SQL migrations plus `000_START_HERE.md`) plus the current frontend-generated database types and production R1–R8 authority reports. Historical migrations are **not** replayed against Neon; their final application state is consolidated into `server/database/migrations/001_baseline.sql`.

## Baseline scope

- 45 existing application tables represented in the Supabase history.
- 1 new portable `users` table replacing future dependence on `auth.users`.
- Existing Supabase user UUIDs are preserved by copying `auth.users.id` into `public.users.id`.
- PostgreSQL-native UUID, JSONB, arrays, INET, partial indexes, GIN indexes, constraints and transactions are retained.
- Supabase Auth, RLS policies, Supabase role names, storage policies, realtime configuration and RPC business functions are excluded from the clean target.
- Authorization moves to Express middleware/service policy checks; hard data integrity remains enforced by PostgreSQL.

## Canonical migration

`server/database/migrations/001_baseline.sql`

This migration is only for a new empty PostgreSQL database. Never run it on the existing Supabase production database.

## Portability rule

The schema must run on ordinary PostgreSQL, including Neon, local PostgreSQL and a future VPS-hosted PostgreSQL instance. The future PHP backend can use the same schema through PDO PostgreSQL.

## Migration execution

- `DATABASE_URL`: pooled application connection.
- `MIGRATION_DATABASE_URL`: direct/unpooled connection preferred for migrations.
- Applied migrations are checksummed and immutable.
- An advisory lock prevents two deploys from migrating simultaneously.

Commands:

```bash
cd server
npm install
npm run db:verify
npm run db:status
npm run db:migrate
```

## Deliberately deferred

Phase 2 does not:

- migrate production rows yet;
- replace Supabase Auth;
- change the React data client;
- move images;
- implement checkout/payment services;
- disable Supabase RLS;
- change the existing production database.

Those are later cutover phases after regression validation.
