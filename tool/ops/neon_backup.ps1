param(
  [string]$OutputDir = ".\backups",
  [string]$DatabaseUrl = $env:MIGRATION_DATABASE_URL
)
$ErrorActionPreference = "Stop"
if (-not $DatabaseUrl) { $DatabaseUrl = $env:DATABASE_URL }
if (-not $DatabaseUrl) { throw "Set MIGRATION_DATABASE_URL (preferred) or DATABASE_URL." }
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) { throw "pg_dump is required and was not found in PATH." }
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $OutputDir "electroobuddy-$stamp.dump"
& pg_dump --dbname=$DatabaseUrl --format=custom --no-owner --no-acl --file=$file
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
$hash = (Get-FileHash -Algorithm SHA256 $file).Hash.ToLowerInvariant()
$meta = [ordered]@{ createdAt=(Get-Date).ToUniversalTime().ToString("o"); file=(Split-Path -Leaf $file); sha256=$hash; sizeBytes=(Get-Item $file).Length; format="pg_custom" }
$meta | ConvertTo-Json | Set-Content "$file.json" -Encoding UTF8
Write-Host "BACKUP PASS: $file"
Write-Host "SHA256: $hash"
