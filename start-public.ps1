# Public access with fixed Cloudflare domain
param(
    [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$DefaultPublicUrl = "https://gzmzdxwlyjdgcxysys.top"
$EnvFile = Join-Path $PSScriptRoot ".env"
$PublicUrlFile = Join-Path $PSScriptRoot "public-url.txt"
$LogDir = Join-Path $PSScriptRoot "logs"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

function Read-DotEnv {
    param([string]$Path)
    $map = @{}
    if (-not (Test-Path $Path)) { return $map }
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $map[$matches[1].Trim()] = $matches[2].Trim().Trim('"')
        }
    }
    return $map
}

function Set-PublicUrl {
    param([string]$Url)
    if (-not $Url) { return }
    $Url = $Url.TrimEnd('/')
    Set-Content -Path $PublicUrlFile -Value $Url -Encoding UTF8
    if (-not (Test-Path $EnvFile)) { return }
    $lines = Get-Content $EnvFile
    foreach ($key in @("PUBLIC_URL", "NEXTAUTH_URL")) {
        $pattern = "^\s*$key="
        $idx = 0..($lines.Count - 1) | Where-Object { $lines[$_] -match $pattern } | Select-Object -First 1
        if ($null -ne $idx) { $lines[$idx] = "$key=`"$Url`"" }
        else { $lines += "$key=`"$Url`"" }
    }
    Set-Content -Path $EnvFile -Value $lines -Encoding UTF8
    Write-Host ">>> Public URL: $Url" -ForegroundColor Green
}

function Stop-PortProcess {
    param([int]$Port)
    Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

function Test-ServerReady {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        return $r.StatusCode -eq 200
    } catch { return $false }
}

function Stop-ProjectProcesses {
    Write-Host ">>> Stopping existing app processes..." -ForegroundColor Cyan
    Stop-PortProcess -Port 3000

    $projectPath = $PSScriptRoot
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $cmd = $_.CommandLine
            if (-not $cmd) { return $false }
            if ($cmd -notlike "*$projectPath*") { return $false }
            return $cmd -match 'next(\.cmd)? (start|dev|build)|npm(\.cmd)? run (start|dev|public|build)|tsx|prisma|node(\.exe)? .*next'
        } |
        ForEach-Object {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }

    Start-Sleep -Seconds 2
}

function Invoke-Build {
    param([int]$MaxAttempts = 3)

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        if ($attempt -gt 1) {
            Write-Host ">>> Build retry $attempt/$MaxAttempts ..." -ForegroundColor Yellow
            Stop-ProjectProcesses
        }

        npm run build
        if ($LASTEXITCODE -eq 0) { return $true }
    }

    return $false
}

function Open-PublicSite {
    param([string]$Url)
    if (-not $Url) { return }
    $Url = $Url.TrimEnd('/')
    Write-Host ">>> Opening browser: $Url" -ForegroundColor Cyan
    Start-Process $Url
}

$envMap = Read-DotEnv -Path $EnvFile
$publicUrl = $envMap["PUBLIC_URL"]
if ($publicUrl) { $publicUrl = $publicUrl.Trim().TrimEnd("/") } else { $publicUrl = $DefaultPublicUrl }
if ($publicUrl -notmatch "^https?://") { $publicUrl = "https://$publicUrl" }

Stop-ProjectProcesses
Set-PublicUrl -Url $publicUrl

Write-Host ">>> [1/3] Build..." -ForegroundColor Cyan
if (-not (Invoke-Build)) {
    Write-Host "ERROR: build failed" -ForegroundColor Red
    Write-Host ">>> Tip: close other terminals running npm/next, then retry: npm run public" -ForegroundColor Yellow
    exit 1
}

Write-Host ">>> [2/3] Start server..." -ForegroundColor Cyan
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
    Write-Host "ERROR: server failed" -ForegroundColor Red
    exit 1
}

Write-Host ">>> [3/3] Ready" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Public access configured" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  URL:   $publicUrl" -ForegroundColor Yellow
Write-Host "  Local: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Logs:  $LogDir" -ForegroundColor DarkGray
Write-Host "  Auto-start on logon: npm run public:install" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Green

if ($OpenBrowser) {
    Start-Sleep -Seconds 2
    Open-PublicSite -Url $publicUrl
}
