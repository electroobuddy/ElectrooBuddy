param([Parameter(Mandatory=$true)][string]$ProjectPath)
$ErrorActionPreference = 'Stop'
$project = (Resolve-Path $ProjectPath).Path
$dest = Join-Path $project 'vite.config.ts'
if (-not (Test-Path (Join-Path $project 'package.json'))) { throw 'The selected path is not a frontend project root.' }
if (-not (Test-Path $dest)) { throw 'vite.config.ts not found in the project root.' }
$source = Join-Path $PSScriptRoot 'vite.config.ts'
Copy-Item $dest ($dest + '.backup') -Force
Copy-Item $source $dest -Force
Write-Host 'Vite React deduplication configured.'
Write-Host 'Stop any active Vite process before clearing its cache.'
$cache = Join-Path $project 'node_modules\.vite'
if (Test-Path $cache) { Remove-Item $cache -Force -Recurse; Write-Host 'Cleared Vite optimized dependency cache.' }
Push-Location $project
try {
  Write-Host 'Checking installed React copies (review output for duplicates):'
  npm ls react react-dom
  if ($LASTEXITCODE -ne 0) { Write-Warning 'React dependency tree reported an issue: investigate duplicates or invalid peer dependencies.' }
  Write-Host 'Checking frontend compilation:'
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed. See errors above.' }
} finally { Pop-Location }
Write-Host 'Patch and frontend build completed. Start backend in one terminal and Vite in another.'
