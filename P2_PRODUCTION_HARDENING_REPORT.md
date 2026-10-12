# P2 — XSS, Input Validation & Production Hardening

## Completed
- Added centralized `escapeHtml`, `safeJsonLd`, rich-text allowlist sanitizer, external URL sanitizer, bounded text cleaner, and image-upload validator.
- `Tips.tsx` rich HTML is sanitized before `dangerouslySetInnerHTML`.
- Product JSON-LD escapes `<`, `>`, and `&` before script injection.
- Receipt/booking/order invoice HTML now escapes major user/database-controlled values before `document.write`.
- DB/config-controlled social, courier, tracking and offer URLs reject non-HTTP(S) schemes.
- Admin image uploads enforce JPG/PNG/WebP/AVIF and a 3 MB limit client-side.
- Supabase `images` bucket receives the same MIME/size boundary in SQL.
- Contact form validates lengths/email/phone and normalizes bounded text.
- Contact writes now use `submit_contact_message` rather than direct public table inserts.
- Added server-side contact anti-spam: max 3 matching submissions per 15 minutes.
- Added rate-limit cleanup RPC restricted to `service_role`.
- Added CSP, Referrer-Policy, Permissions-Policy and Cross-Origin-Opener-Policy; removed obsolete X-XSS-Protection.
- Re-applied revocations for legacy privileged SECURITY DEFINER RPCs after the historical migration chain.
- Narrowed another set of safe `select("*")` calls in tracking, booking, user-profile and technician authorization screens.

## Static audit
- Remaining `select("*")` calls: 28. These are concentrated in admin/feature screens and should be validated against exact field usage in final QA.
- Remaining `dangerouslySetInnerHTML` sites are controlled:
  - Tips: allowlist sanitizer.
  - ProductDetails: safe JSON-LD serializer.
  - UI chart: framework-generated CSS, not database/user HTML.
- Remaining `document.write` sites are print-only documents and now escape the principal dynamic text fields.

## Deployment order
1. Apply `20260922_p2_production_hardening.sql`.
2. Deploy frontend.
3. Verify CSP in browser console against Supabase, Firebase and Razorpay production flows.
4. Keep the P1 `INTERNAL_FUNCTION_SECRET` configured.

## Build validation
`npm run build` was attempted, but this materialized archive still has unusable node binaries: `vite: Permission denied`. No successful build is claimed.
Run locally: `npm install`, `npm run build`, `npm run lint`, `npm run audit:bundle`, and Lighthouse.

## Next phase
Final Production QA + Lighthouse + Security Regression Audit.
