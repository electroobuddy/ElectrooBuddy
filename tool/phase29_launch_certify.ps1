param(
  [string]$FrontendUrl = $env:PHASE29_FRONTEND_URL,
  [string]$ApiOrigin = $env:PHASE29_API_ORIGIN
)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root
function Run([string]$label,[scriptblock]$cmd){Write-Host "`n=== $label ===" -ForegroundColor Cyan; & $cmd; if($LASTEXITCODE -ne 0){throw "$label failed with exit code $LASTEXITCODE"}}
if(-not $FrontendUrl -or -not $ApiOrigin){throw 'Set PHASE29_FRONTEND_URL and PHASE29_API_ORIGIN to the real HTTPS production URLs.'}
$env:PHASE29_FRONTEND_URL=$FrontendUrl
$env:PHASE29_API_ORIGIN=$ApiOrigin
if(-not $env:DATABASE_URL -and -not $env:MIGRATION_DATABASE_URL){throw 'Set DATABASE_URL or MIGRATION_DATABASE_URL.'}
if(-not $env:PHASE29_BACKUP_MANIFEST){throw 'Set PHASE29_BACKUP_MANIFEST to the latest verified backup .json manifest.'}
if(-not $env:PHASE29_RESTORE_DRILL_EVIDENCE){throw 'Set PHASE29_RESTORE_DRILL_EVIDENCE to a successful disposable restore-drill output/report.'}
Run 'Phase 22-29 static regression chain' { npm run certify:operations; npm run audit:backend-phase29 }
Run 'Frontend lint/test/build' { npm run lint; npm test; npm run build }
if(-not (Test-Path '.\server\package-lock.json')){throw 'server/package-lock.json is required for deterministic launch certification. Generate and commit it with: npm --prefix server install --package-lock-only'}
Run 'Server deterministic install' { npm --prefix server ci }
Run 'Server typecheck/test/build' { npm run server:verify }
Run 'Database migration status' { npm run db:status }
Run 'Database migrate' { npm run db:migrate }
Run 'Database verification' { npm run db:verify }
Run 'Phase 29 live GO/NO-GO certification' { npm --prefix server run phase29:live }
Write-Host "`nPHASE 29 FINAL LAUNCH CERTIFICATION: GO" -ForegroundColor Green
