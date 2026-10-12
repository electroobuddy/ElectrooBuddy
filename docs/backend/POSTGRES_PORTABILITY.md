# Portable PostgreSQL Rules

Goal: use Neon now while retaining the ability to run the same logical schema on standard PostgreSQL from PHP/PDO later.

## Allowed baseline
- PostgreSQL UUIDs
- `NUMERIC(p,s)`
- `TIMESTAMPTZ`
- `TEXT`, `BOOLEAN`, `INTEGER`, `BIGINT`
- `JSONB` when the shape is genuinely semi-structured
- B-tree indexes, partial indexes where valuable
- foreign keys/check constraints/unique constraints
- transactions, savepoints and row locks
- SQL views for read models

## Rules

1. Do not put core business rules in Neon-only APIs.
2. Do not make Supabase RLS/RPC/Auth/Storage part of the new contract.
3. Database functions may be used only where transactional integrity materially benefits; document every one and keep standard PostgreSQL syntax.
4. Prefer application services plus database constraints over hidden trigger-heavy behavior.
5. Use `NUMERIC`, never floating point, for monetary values.
6. Preserve existing UUID primary keys during migration wherever possible.
7. Every timestamp is timezone-aware (`TIMESTAMPTZ`) and stored in UTC semantics.
8. Use lowercase `snake_case` identifiers compatible with Node and PHP conventions.
9. Avoid quoted mixed-case identifiers.
10. Every foreign-key column needed in filters/joins is reviewed for indexing.
11. Delete behavior is explicit (`RESTRICT`, `CASCADE`, `SET NULL`) rather than relying on defaults.
12. Soft-delete/archive fields are preferred for financially referenced master data.

## Schema migration ownership

The canonical schema is SQL migration files, not Neon UI state and not ORM auto-sync.

Phase 1/2 target:

```text
server/database/migrations/
  001_baseline.sql
  002_*.sql
```

The same files must be executable against local PostgreSQL and Neon.

## Future PHP compatibility

A PHP implementation connects through `pdo_pgsql` and reproduces `/api/v1` behavior. It must not require a database conversion to MySQL.
