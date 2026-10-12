# Phase 9 Validation Report

## Static regression gates
PASS: Phase 0 through Phase 9 static audits.

## Phase 9 controls verified
- Technician application/profile/dashboard/admin APIs are present behind authenticated Express routes.
- Admin creation uses native user + Argon2id password path.
- Approval/rejection manages portable technician role membership.
- Disable blocks when active assignments exist, disables native user, and revokes active sessions.
- Workload counts are derived from current booking rows; the browser does not submit authoritative counts.
- Admin booking Express mutations use explicit transition/assignment/unassignment/operational-update/archive endpoints.
- Financial booking fields are excluded from the Express operational update schema and disabled in the native admin editor.
- Express archive allows only terminal completed/cancelled bookings; no hard delete API is exposed.
- `VITE_TECHNICIAN_BACKEND` defaults to `supabase`; production native booking creation remains gated by Phase 8 settings.

## Runtime limitation
The artifact does not include installed node_modules, so a dependency-backed TypeScript/Vitest/production-build pass is not claimed. Run the documented local/CI verification before staging cutover.
