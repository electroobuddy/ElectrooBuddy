# Phase 9 — Technician Domain + Admin Booking Operations

Phase 9 moves technician profile/application/approval/status/workload operations and the remaining admin booking operational mutations behind the Express/PostgreSQL API, while retaining Supabase as the production fallback until parity validation completes.

## Security boundaries
- Admin-created technician accounts use native Argon2id credentials and the portable `users` / `user_roles` tables.
- Technician approval grants the `technician` role; rejection removes it.
- Disabling a technician revokes active native sessions and disables the portable user account.
- A technician cannot be disabled while assigned to active bookings; bookings must be reassigned first.
- Technician self-updates cannot change approval, priority, daily limit, identity email, or admin-managed experience.
- Admin booking edits through Express cannot modify coupon, discount, subscription benefit, original amount, final amount, service pricing, or other financial authority fields.
- Express booking delete is replaced by archive and is allowed only for completed/cancelled bookings.

## Feature gate
Use `VITE_TECHNICIAN_BACKEND=supabase` as the safe default. Staging can use `express` only with Phase 3 native/hybrid authentication and after technician parity succeeds.

## Data migration
Run `npm run technician:sync-source` for dry-run, then add `-- --apply`, then `npm run technician:verify-parity`.
