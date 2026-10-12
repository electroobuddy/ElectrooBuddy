$ErrorActionPreference = 'Stop'
Write-Host '=== ElectrooBuddy Phase 27 Production Cutover Certification ===' -ForegroundColor Cyan

if (-not $env:PHASE27_FRONTEND_URL) { throw 'Set PHASE27_FRONTEND_URL=https://your-frontend-domain' }
if (-not $env:PHASE27_API_ORIGIN) { throw 'Set PHASE27_API_ORIGIN=https://your-api-domain' }

npm run audit:backend-phase22
npm run audit:backend-phase23
npm run audit:backend-phase24
npm run audit:backend-phase25
npm run audit:backend-phase26
npm run audit:backend-phase27
python .\tool\phase27_live_cutover_certify.py

Write-Host 'PHASE 27 CUTOVER CERTIFICATION: PASS' -ForegroundColor Green
