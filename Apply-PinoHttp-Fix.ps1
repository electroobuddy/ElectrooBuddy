param([string]$ProjectPath = (Get-Location).Path)
$ErrorActionPreference = 'Stop'
$target = Join-Path $ProjectPath 'server\src\middleware\http-logger.ts'
$source = Join-Path $PSScriptRoot 'server\src\middleware\http-logger.ts'
if (-not (Test-Path $target)) { throw "Target not found: $target" }
if (-not (Test-Path (Join-Path $ProjectPath 'server\package.json'))) { throw 'Not an ElectrooBuddy project root.' }
$original = Get-Content $target -Raw
if ($original -notmatch "pino-http") { throw 'Expected pino-http import not found; refusing to overwrite.' }
$backup = "$target.backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
Copy-Item $target $backup -ErrorAction Stop
Copy-Item $source $target -Force
$a = (Get-FileHash -Algorithm SHA256 $source).Hash
$b = (Get-FileHash -Algorithm SHA256 $target).Hash
if ($a -ne $b) { throw 'Source checksum mismatch after copy.' }
Write-Host "Applied fix; backup: $backup"
Push-Location $ProjectPath
try {
  npm run server:build
  if ($LASTEXITCODE -ne 0) { throw 'Backend build failed' }
  npm --prefix server test
  if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed' }
} finally { Pop-Location }
