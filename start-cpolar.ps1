param(
    [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$LogDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

function Stop-PortProcess {
    param([int]$Port)
    Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

function Test-ServerReady {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 5
        return $r.StatusCode -eq 200
    } catch { return $false }
}

Write-Host ">>> [1/4] Build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ">>> [2/4] Start server..." -ForegroundColor Cyan
Stop-PortProcess -Port 3000
Start-Sleep -Seconds 1

$serverLog = Join-Path $LogDir "server.log"
$serverErr = Join-Path $LogDir "server.err.log"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run start" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput $serverLog -RedirectStandardError $serverErr

for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-ServerReady) { break }
}
if (-not (Test-ServerReady)) {
    Write-Host "ERROR: local server failed to start on port 3000" -ForegroundColor Red
    exit 1
}

Write-Host ">>> [3/4] Sync cpolar URL..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "sync-cpolar-url.ps1")
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: cpolar is not running or no tunnel found" -ForegroundColor Red
    Write-Host "Run in another terminal: cpolar http 3000" -ForegroundColor Yellow
    exit 1
}

Write-Host ">>> [4/4] Restart server with new public URL..." -ForegroundColor Cyan
Stop-PortProcess -Port 3000
Start-Sleep -Seconds 1
Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run start" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput $serverLog -RedirectStandardError $serverErr

for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-ServerReady) { break }
}

$publicUrl = (Get-Content (Join-Path $PSScriptRoot "public-url.txt") -Raw).Trim()

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Public access ready (cpolar)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  URL:   $publicUrl" -ForegroundColor Yellow
Write-Host "  Local: http://127.0.0.1:3000" -ForegroundColor Yellow
Write-Host "  Note:  bbroot.com needs DNSHE client; use cpolar URL above" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Green

if ($OpenBrowser) {
    Start-Process $publicUrl
}