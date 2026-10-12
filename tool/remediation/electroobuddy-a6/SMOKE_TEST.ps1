param(
  [Parameter(Mandatory=$true)][string]$FrontendUrl,
  [Parameter(Mandatory=$true)][string]$BackendUrl
)
$ErrorActionPreference = 'Stop'
$FrontendUrl = $FrontendUrl.TrimEnd('/')
$BackendUrl = $BackendUrl.TrimEnd('/')
if (!$FrontendUrl.StartsWith('https://') -or !$BackendUrl.StartsWith('https://')) { throw 'Both URLs must use HTTPS.' }
$paths = @(
  @{Label='Frontend landing';Url="$FrontendUrl/"},
  @{Label='Proxied public API';Url="$FrontendUrl/api/v1/health"},
  @{Label='Direct public API';Url="$BackendUrl/api/v1/health"}
)
foreach ($case in $paths) {
  try {
    $r=Invoke-WebRequest -Uri $case.Url -Method Get -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 15
    Write-Host "$($case.Label): HTTP $($r.StatusCode), type=$($r.Headers['Content-Type']), proxy=$($r.Headers['x-electroobuddy-proxy'])"
    if ($case.Label -eq 'Proxied public API' -and $r.StatusCode -eq 502) { Write-Warning 'Check API_ORIGIN, API hosting, and proxy upstream connectivity.' }
  } catch { Write-Warning "$($case.Label): $($_.Exception.Message)" }
}
Write-Host 'Manual checks still needed: login/refresh/logout cookie, auth denial, bookings, CORS, webhooks with provider test events.'
