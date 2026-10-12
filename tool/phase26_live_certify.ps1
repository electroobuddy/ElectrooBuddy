param(
  [string]$ApiBaseUrl = $env:PHASE26_API_BASE_URL,
  [switch]$SkipInstall,
  [switch]$SkipMigrate
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Run([string]$Label, [scriptblock]$Command) {
  Write-Host "`n=== $Label ===" -ForegroundColor Cyan
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$Label failed with exit code $LASTEXITCODE" }
}

if (-not $env:DATABASE_URL -and -not $env:MIGRATION_DATABASE_URL) {
  throw 'Set DATABASE_URL or MIGRATION_DATABASE_URL before running Phase 26 live certification.'
}

if (-not (Test-Path 'server/package-lock.json')) {
  if ($SkipInstall) { throw 'server/package-lock.json is missing and -SkipInstall was requested.' }
  Run 'Generate server lockfile' { npm --prefix server install --package-lock-only }
}

if (-not $SkipInstall) {
  Run 'Install frontend dependencies' { npm ci }
  Run 'Install server dependencies' { npm --prefix server ci }
}

Run 'Phase 22 regression' { npm run audit:backend-phase22 }
Run 'Phase 23 regression' { npm run audit:backend-phase23 }
Run 'Phase 24 regression' { npm run audit:backend-phase24 }
Run 'Phase 25 regression' { npm run audit:backend-phase25 }
Run 'Phase 26 readiness' { npm run audit:backend-phase26 }
Run 'Server verification' { npm run server:verify }
Run 'Frontend production build' { npm run build }
Run 'Database status (before)' { npm run db:status }

if (-not $SkipMigrate) {
  Run 'Database migrations' { npm run db:migrate }
}

Run 'Database status (after)' { npm run db:status }
Run 'Portable database verification' { npm run db:verify }

if ($ApiBaseUrl) { $env:PHASE26_API_BASE_URL = $ApiBaseUrl }
Run 'Live Neon/API smoke certification' { npm run server:phase26:live }

Write-Host "`nPHASE 26 LIVE CERTIFICATION SEQUENCE: PASS" -ForegroundColor Green
