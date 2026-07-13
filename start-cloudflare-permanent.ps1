# 贵州民族大学机器人实验室 - Cloudflare 永久隧道部署
# 隧道名称: robot-lab
# 隧道 ID: f4c1a40a-a25c-44cb-800b-99b84851e44d

param(
    [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$CloudflaredDir = Join-Path $PSScriptRoot "cloudflared"
$CloudflaredBin = Join-Path $CloudflaredDir "cloudflared.exe"
$ConfigFile = Join-Path $CloudflaredDir "config.yml"
$LogDir = Join-Path $PSScriptRoot "logs"
$EnvFile = Join-Path $PSScriptRoot ".env"
$PublicUrlFile = Join-Path $PSScriptRoot "public-url.txt"
$TunnelLog = Join-Path $LogDir "cloudflared-permanent.log"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# ---------- helpers ----------
function Write-Step { param([string]$Msg) Write-Host ">>> $Msg" -ForegroundColor Cyan }

function Stop-Existing {
    Write-Step "Stopping existing processes..."
    Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

function Test-ServerReady {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 5
        return $r.StatusCode -eq 200
    } catch { return $false }
}

# ---------- main ----------
Stop-Existing

# Step 1: Check prerequisites
Write-Step "[1/4] Check prerequisites..."
if (-not (Test-Path $CloudflaredBin)) {
    Write-Host "ERROR: cloudflared.exe not found" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $ConfigFile)) {
    Write-Host "ERROR: config.yml not found at $ConfigFile" -ForegroundColor Red
    Write-Host "Please create it first (see instructions below)" -ForegroundColor Yellow
    exit 1
}

# Read the hostname from config.yml for display
$hostname = (Select-String -Path $ConfigFile -Pattern 'hostname:\s+(.+)' | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
if ($hostname -match 'example\.com') {
    Write-Host "WARNING: config.yml still has the placeholder domain '$hostname'" -ForegroundColor Yellow
    Write-Host "Edit cloudflared/config.yml and replace it with your real domain." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then run this command to set up DNS routing:" -ForegroundColor Yellow
    Write-Host "  ./cloudflared/cloudflared.exe tunnel route dns robot-lab YOUR_DOMAIN" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Step 2: Build
Write-Step "[2/4] Build project..."
$env:PUBLIC_URL = "https://$hostname"
$env:NEXTAUTH_URL = "https://$hostname"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit 1
}

# Update .env with the fixed domain
$publicUrl = "https://$hostname"
Set-Content -Path $PublicUrlFile -Value $publicUrl -Encoding UTF8
if (Test-Path $EnvFile) {
    $lines = Get-Content $EnvFile
    foreach ($key in @("PUBLIC_URL", "NEXTAUTH_URL")) {
        $pattern = "^\s*$key="
        $idx = 0..($lines.Count - 1) | Where-Object { $lines[$_] -match $pattern } | Select-Object -First 1
        if ($null -ne $idx) { $lines[$idx] = "$key=`"$publicUrl`"" }
        else { $lines += "$key=`"$publicUrl`"" }
    }
    Set-Content -Path $EnvFile -Value $lines -Encoding UTF8
}
Write-Host ">>> Public URL: $publicUrl" -ForegroundColor Green

# Step 3: Start Next.js server
Write-Step "[3/4] Start Next.js server..."
$serverLog = Join-Path $LogDir "server.log"
$serverErr = Join-Path $LogDir "server.err.log"
$serverJob = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run start" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $serverLog -RedirectStandardError $serverErr

for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-ServerReady) { break }
}
if (-not (Test-ServerReady)) {
    Write-Host "ERROR: Server failed to start" -ForegroundColor Red
    exit 1
}
Write-Host ">>> Server running on http://localhost:3000" -ForegroundColor Green

# Step 4: Start Cloudflare Tunnel (permanent)
Write-Step "[4/4] Start permanent tunnel..."
Write-Host ">>> Tunnel name: robot-lab" -ForegroundColor Gray
Write-Host ">>> Hostname:    $hostname" -ForegroundColor Gray

$tunnelProcess = Start-Process -FilePath $CloudflaredBin `
    -ArgumentList "tunnel","--config",$ConfigFile,"run","robot-lab" `
    -WindowStyle Hidden `
    -PassThru `
    -RedirectStandardOutput $TunnelLog `
    -RedirectStandardError (Join-Path $LogDir "cloudflared-permanent.err.log")

# ---------- done ----------
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Cloudflare 永久隧道已启动" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  公网地址: $publicUrl" -ForegroundColor Yellow
Write-Host "  本地地址: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  隧道名称: robot-lab" -ForegroundColor DarkGray
Write-Host "  停止服务: Ctrl+C" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Green

if ($OpenBrowser) {
    Start-Process $publicUrl
}

# Keep alive
try {
    while ($true) {
        Start-Sleep -Seconds 10
        if ($tunnelProcess.HasExited) {
            Write-Host "WARNING: Tunnel process exited!" -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host ">>> Shutting down..." -ForegroundColor Cyan
    Stop-Existing
}
