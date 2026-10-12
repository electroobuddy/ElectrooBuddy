# ElectrooBuddy database

`migrations/001_baseline.sql` is the first portable PostgreSQL baseline for the Express migration.

It is designed for Neon PostgreSQL first and standard PostgreSQL later. It intentionally contains no Supabase `auth.*` references, RLS policies, storage policies, or Edge Function dependencies.

## Safety

Do **not** run `001_baseline.sql` against the existing Supabase production database. It is a clean-target baseline for a new Neon/local/VPS PostgreSQL database.

## Commands

```bash
npm run db:migrate
npm run db:status
npm run db:verify
```

Set `DATABASE_URL` in `server/.env` first. For Neon, use the pooled connection string for the API and a direct/unpooled connection string in `MIGRATION_DATABASE_URL` for migrations when available.
