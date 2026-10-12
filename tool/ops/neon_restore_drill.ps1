param(
  [Parameter(Mandatory=$true)][string]$BackupFile,
  [string]$TargetDatabaseUrl = $env:RESTORE_DRILL_DATABASE_URL,
  [string]$ConfirmDisposableDatabaseName
)
$ErrorActionPreference = "Stop"
if (-not $TargetDatabaseUrl) { throw "Set RESTORE_DRILL_DATABASE_URL to a disposable database. Never use production." }
if ($TargetDatabaseUrl -eq $env:DATABASE_URL -or $TargetDatabaseUrl -eq $env:MIGRATION_DATABASE_URL) { throw "Restore drill target must not equal the configured production/migration database URL." }
if (-not $ConfirmDisposableDatabaseName) { throw "Pass -ConfirmDisposableDatabaseName with the exact name of a disposable database." }
$targetUri = [uri]$TargetDatabaseUrl
$actualName = [uri]::UnescapeDataString($targetUri.AbsolutePath.TrimStart('/'))
if ($actualName -ne $ConfirmDisposableDatabaseName) { throw "Disposable target name mismatch. Refusing restore." }
if ($actualName -notmatch '(?i)(drill|test|disposable|restore)') { throw "Target database name must identify a disposable restore/test database." }
if (-not (Test-Path $BackupFile)) { throw "Backup file not found: $BackupFile" }
if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) { throw "pg_restore is required and was not found in PATH." }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { throw "psql is required and was not found in PATH." }
$metaPath = "$BackupFile.json"
if (Test-Path $metaPath) {
  $meta = Get-Content $metaPath -Raw | ConvertFrom-Json
  $actual = (Get-FileHash -Algorithm SHA256 $BackupFile).Hash.ToLowerInvariant()
  if ($actual -ne $meta.sha256) { throw "Backup checksum mismatch. Refusing restore." }
}
& pg_restore --dbname=$TargetDatabaseUrl --clean --if-exists --no-owner --no-acl $BackupFile
if ($LASTEXITCODE -ne 0) { throw "pg_restore failed with exit code $LASTEXITCODE" }
$tables = & psql $TargetDatabaseUrl -Atc "select count(*) from information_schema.tables where table_schema='public';"
$migrations = & psql $TargetDatabaseUrl -Atc "select count(*) from public.schema_migrations;"
$users = & psql $TargetDatabaseUrl -Atc "select count(*) from public.users;"
if ([int]$tables -lt 10 -or [int]$migrations -lt 22) { throw "Restore verification failed: tables=$tables migrations=$migrations" }
Write-Host "RESTORE DRILL PASS: tables=$tables migrations=$migrations users=$users"
