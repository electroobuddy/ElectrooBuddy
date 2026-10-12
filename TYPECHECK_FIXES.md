# TypeScript build errors — remediation

The supplied error log contains 347 diagnostics, largely cascading from missing backend npm dependencies. The backend ZIP has no `server/node_modules` or `server/package-lock.json`.

## Required setup (PowerShell)

```powershell
cd server
npm install
npm run typecheck
npm test
npm run build
```

Run from **server/**, not the repository root. `npm install` needs network registry access. Do not add `any` or disable strict TypeScript to suppress errors. After the backend dependencies install, commit the newly generated `server/package-lock.json` and use `npm ci` thereafter.

## Targeted source corrections

- Booking quote passes explicit null / false values under `exactOptionalPropertyTypes`.
- Payment finalization normalizes optional provider method to null.
- Refund webhook normalizes optional event id to null.
- Shiprocket order lookup supplies strings rather than explicit undefined.
- Database test stub includes `withTransaction` required by `DatabaseClient`.

The environment used to prepare this package could not complete `npm install`, so a fresh typecheck and test result are **not claimed**. Any errors remaining after installation need an additional compiler pass.
