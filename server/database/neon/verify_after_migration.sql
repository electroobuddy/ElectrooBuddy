-- Run only after 001_baseline.sql has been applied to the clean Neon target.
SELECT current_database() AS database_name, current_user AS database_user, version() AS postgres_version;

SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pg_trgm','pgcrypto')
ORDER BY extname;

SELECT count(*) AS portable_application_tables
FROM information_schema.tables
WHERE table_schema='public'
  AND table_type='BASE TABLE'
  AND table_name NOT IN ('schema_migrations');

SELECT version, checksum, applied_at
FROM public.schema_migrations
ORDER BY version;

-- Must return zero rows: no foreign key should reference a non-public legacy auth schema.
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype='f'
  AND pg_get_constraintdef(oid) ILIKE '%auth.%';
