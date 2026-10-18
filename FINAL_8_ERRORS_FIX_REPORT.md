# Final 8 server TypeScript errors — source corrections

Source: user's 2026-10-14 `npm run server:build` log. This package was generated from `ElectrooBuddy-build8-fixed.zip` and corrects call-site typing without relaxing `exactOptionalPropertyTypes`.

## Changes
- Added `server/src/utils/omit-undefined.ts` to remove properties with `undefined` values from validated partial objects.
- Applied it to profile updates, catalog filters, checkout input and nested address, pricing quotes, technician admin updates and self updates.
- Made `pino-http`'s request ID callback always return a non-empty string, including for missing or array-valued headers.
- Aligned technician repository `skills` patch typing with the service's optional input.

## Verification
- Files inspected and static source assertions passed.
- TypeScript build **not executed**: this archive does not include node_modules or `server/package-lock.json`, and `npm install --offline` cannot resolve @aws-sdk/client-s3 from this environment's cache.
- User's previous run reported 10/10 Vitest tests passing; these tests were not rerun in this environment.
- The user's `npm install` also reported 4 dependency vulnerabilities (1 moderate, 1 high, 2 critical). This remains an **independent security blocker**. Run `npm --prefix server audit --json` and assess non-breaking updates before considering `npm audit fix --force`.

## Local commands
Run at the project root after extracting:
```
npm --prefix server install
npm run server:build
npm --prefix server test
npm --prefix server audit
```
Do not assume production readiness until build and security audit are clean.
