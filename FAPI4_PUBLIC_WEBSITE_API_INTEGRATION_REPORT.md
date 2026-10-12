# FAPI-4 — Public Website API Integration & Static Business-Data Fallback Removal

## Result

PASS — public business content is now API-authoritative across the primary public experience.

## Completed

- Removed bundled/static service fallback authority from the services store.
- Removed bundled team fallback from Home and About.
- Removed bundled testimonial fallback from Home.
- Removed bundled project fallback from Projects.
- Offers now expose an API error + retry state instead of silently disappearing on failure.
- Products now retry through the API store without forcing a full browser reload.
- Added shared `PublicApiState` component for public error/empty/retry handling.
- Public cached hooks now support explicit refetch/invalidation.
- Removed fabricated public stats offsets and hardcoded fallback counters.
- Site contact/settings data now drives Home, Footer, Contact, service cards, floating call/WhatsApp actions, Services emergency CTA, and Request Service support contact.
- Site-settings failure no longer silently falls back to old business contact/social values in these primary surfaces.

## Validation

- FAPI-1: PASS
- FAPI-2: PASS
- FAPI-3: PASS
- FAPI-4: 27/27 PASS
- Modified TypeScript/TSX transpile checks: PASS
- Phase 24 zero-Supabase production audit: PASS
- Phase 29 static launch readiness: 43/43 PASS

## New command

```powershell
npm run audit:fapi4
```

## Notes

Visual image fallbacks are intentionally retained (for example team avatar placeholders). They are presentation fallbacks, not business-data authority.

The package does not include installed `node_modules`, so dependency-linked `vite build`/Vitest execution should still be run in the normal local or CI environment.
