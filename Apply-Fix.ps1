param([Parameter(Mandatory=$true)][string]$ProjectPath)
$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'src\components\Requestservicesection.tsx'
$target = Join-Path $ProjectPath 'src\components\Requestservicesection.tsx'
if (-not (Test-Path -LiteralPath $target)) { throw "Target file not found: $target" }
$existing = Get-Content -LiteralPath $target -Raw -Encoding UTF8
if ($existing -notmatch '\{charge\s*&&') { throw 'The expected undefined charge block is not present; refusing to replace a potentially newer file. Please review the target manually.' }
$backup = "$target.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
Copy-Item -LiteralPath $target -Destination $backup
Copy-Item -LiteralPath $source -Destination $target -Force
$expected=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
$actual=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
if ($expected -ne $actual) { throw 'File checksum mismatch after copy' }
Write-Host "Patched $target; backup: $backup"
Write-Host 'Run npm run build, then npm run dev -- --force'
