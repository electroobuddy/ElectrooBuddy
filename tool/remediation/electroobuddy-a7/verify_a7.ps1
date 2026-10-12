param([string]$Repository = '.', [switch]$CheckDatabase)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path $Repository).Path
python (Join-Path $PSScriptRoot 'audit_a7.py') $repo
if ($LASTEXITCODE -ne 0) { Write-Warning 'A7 static checks detected gaps.' }
if ($CheckDatabase) {
  if (-not $env:MIGRATION_DATABASE_URL -and -not $env:DATABASE_URL) { throw 'Database URL not configured; refusing database checks.' }
  Push-Location $repo
  try {
    npm run db:status
    if ($LASTEXITCODE -ne 0) { throw 'Database status command failed.' }
    npm run db:verify
    if ($LASTEXITCODE -ne 0) { throw 'Database verification failed.' }
    npm --prefix server run ops:status
    if ($LASTEXITCODE -ne 0) { throw 'Operations status failed.' }
  } finally { Pop-Location }
}
