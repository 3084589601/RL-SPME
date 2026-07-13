param(
    [string]$CpolarApi = "http://127.0.0.1:4042/api/tunnels",
    [string]$TargetPort = "3000"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$EnvFile = Join-Path $PSScriptRoot ".env"
$PublicUrlFile = Join-Path $PSScriptRoot "public-url.txt"

function Set-PublicUrl {
    param([string]$Url)
    if (-not $Url) { return $null }
    $Url = $Url.Trim().TrimEnd("/")
    if ($Url -notmatch "^https?://") { $Url = "https://$Url" }

    Set-Content -Path $PublicUrlFile -Value $Url -Encoding UTF8
    if (-not (Test-Path $EnvFile)) { return $Url }

    $lines = Get-Content $EnvFile
    foreach ($key in @("PUBLIC_URL", "NEXTAUTH_URL")) {
        $pattern = "^\s*$key="
        $idx = 0..($lines.Count - 1) | Where-Object { $lines[$_] -match $pattern } | Select-Object -First 1
        if ($null -ne $idx) { $lines[$idx] = "$key=`"$Url`"" }
        else { $lines += "$key=`"$Url`"" }
    }
    if (-not ($lines -match '^\s*AUTH_TRUST_HOST=')) {
        $lines += 'AUTH_TRUST_HOST=true'
    }
    Set-Content -Path $EnvFile -Value $lines -Encoding UTF8
    return $Url
}

try {
    $payload = Invoke-RestMethod -Uri $CpolarApi -TimeoutSec 5
} catch {
    Write-Host "ERROR: cannot read cpolar API at $CpolarApi" -ForegroundColor Red
    Write-Host "Start cpolar first, e.g. cpolar http 3000" -ForegroundColor Yellow
    exit 1
}

$tunnel = $payload.tunnels |
    Where-Object {
        $_.proto -match '^https?$' -and
        "$($_.config.addr)" -match ":$TargetPort$"
    } |
    Sort-Object { $_.public_url -notmatch '^https:' } |
    Select-Object -First 1

if (-not $tunnel) {
    $tunnel = $payload.tunnels | Where-Object { $_.proto -match '^https?$' } | Select-Object -First 1
}

if (-not $tunnel) {
    Write-Host "ERROR: no HTTP tunnel found in cpolar" -ForegroundColor Red
    exit 1
}

$publicUrl = $tunnel.public_url
if ($publicUrl -notmatch '^https:') {
    $publicUrl = ($payload.tunnels | Where-Object { $_.public_url -match '^https:' } | Select-Object -First 1).public_url
}

if (-not $publicUrl) {
    Write-Host "ERROR: no HTTPS tunnel URL found" -ForegroundColor Red
    exit 1
}

$synced = Set-PublicUrl -Url $publicUrl
Write-Host "Synced public URL: $synced" -ForegroundColor Green
Write-Host "Local target: $($tunnel.config.addr)" -ForegroundColor DarkGray