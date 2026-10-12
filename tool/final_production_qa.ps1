$ErrorActionPreference = 'Stop'
Write-Host 'ElectrooBuddy - Native Stack Final Production QA' -ForegroundColor Cyan

npm ci
if (-not (Test-Path '.\server\package-lock.json')) {
  throw 'server/package-lock.json is required for deterministic server CI. Run npm --prefix server install --package-lock-only and commit the lockfile.'
}
npm --prefix server ci

npm run audit:backend-phase22
npm run audit:backend-phase23
npm run audit:backend-phase24
npm run audit:backend-phase25
npm run lint
npm test
npm run build
npm run server:verify

Write-Host 'PASS: native runtime, security boundaries, frontend, and server verification gates.' -ForegroundColor Green
Write-Host 'Next: apply database migrations on staging, run npm run db:verify, and deploy a preview for Lighthouse/smoke tests.' -ForegroundColor Yellow
