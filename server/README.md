# ElectroBuddy Express API

This directory contains the production API for ElectroBuddy. It is the sole runtime backend authority.

## Stack

- Express + TypeScript
- PostgreSQL/Neon
- Native auth/session + RBAC
- Razorpay payment authority
- Shipping/fulfillment provider integration
- Firebase Cloud Messaging
- Scheduled operational workers

## Setup

```powershell
npm ci
copy .env.example .env
npm run db:status
npm run db:migrate
npm run db:verify
npm run dev
```

Use a direct `MIGRATION_DATABASE_URL` for migrations when possible and `DATABASE_URL` for application traffic. Production startup validates HTTPS public URLs, DB SSL, CORS, trust proxy, and non-placeholder JWT secrets.

## Verification

```powershell
npm run build
npm test
npm run verify
```

The legacy Supabase import/cutover bridge has been retired. Historical migration notes are preserved in the repository archive only.
