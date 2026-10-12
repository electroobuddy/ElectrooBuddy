# Neon database preparation

Phase 2 is ready for Neon but does not require production credentials to be committed to the repository.

## 1. Create the Neon project/database

Use a dedicated database for the new backend, separate from the existing Supabase production database.

Recommended environments:

- `electroobuddy_dev`
- `electroobuddy_staging`
- `electroobuddy_prod` later

Do not point Phase 2 migration tooling at the Supabase production connection string.

## 2. Connections

Configure server-only environment variables:

```env
DATABASE_URL=<Neon pooled connection string>
MIGRATION_DATABASE_URL=<Neon direct/unpooled connection string>
DB_SSL=true
```

The React/Vite frontend must never receive either value.

## 3. Apply and verify

```bash
cd server
npm install
npm run db:verify
npm run db:status
npm run db:migrate
npm run db:status
```

Expected final status: `APPLIED 001_baseline.sql`.

## 4. Application DB role

Before production cutover, create a least-privilege application role. The migration/owner role should not be the normal Express runtime identity. The runtime role should receive only the CRUD privileges required by the API and no schema-owner privileges.

## 5. Pooling

Use Neon's pooled URL for the Express API. Keep pool size modest because Render instances and server restarts can otherwise multiply connections. The Phase 1 default is 10 and can be reduced for the free tier.

## 6. Backups/cutover

No Supabase data is deleted in this phase. Production data migration and reconciliation are performed later with counts, foreign-key validation and financial balance checks before any cutover.
