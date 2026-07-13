# 贵州民族大学机器人实验室 - Cloudflare Tunnel 公网部署
param(
    [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$CloudflaredDir = Join-Path $PSScriptRoot "cloudflared"
$CloudflaredBin = Join-Path $CloudflaredDir "cloudflared.exe"
$LogDir = Join-Path $PSScriptRoot "logs"
$EnvFile = Join-Path $PSScriptRoot ".env"
$PublicUrlFile = Join-Path $PSScriptRoot "public-url.txt"
$TunnelLog = Join-Path $LogDir "cloudflared.log"
$TunnelPidFile = Join-Path $LogDir "cloudflared.pid"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# ---------- helpers ----------
function Write-Step { param([string]$Msg) Write-Host ">>> $Msg" -ForegroundColor Cyan }

function Stop-Existing {
    Write-Step "Stopping existing processes..."
    # Kill old cloudflared
    Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    # Kill process on port 3000
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

function Test-LoggedIn {
    # Check if cloudflared has a valid cert
    $certDir = "$env:USERPROFILE\.cloudflared"
    if (-not (Test-Path "$certDir\cert.pem")) { return $false }
    try {
        & $CloudflaredBin tunnel list 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    } catch { return $false }
}

function Invoke-Login {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  首次使用需要登录 Cloudflare 账号" -ForegroundColor Yellow
    Write-Host "  浏览器会自动打开，登录后关闭即可" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    & $CloudflaredBin tunnel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Cloudflare 登录失败" -ForegroundColor Red
        exit 1
    }
}

function Test-ServerReady {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 5
        return $r.StatusCode -eq 200
    } catch { return $false }
}

function Set-PublicUrl {
    param([string]$Url)
    if (-not $Url) { return }
    $Url = $Url.Trim().TrimEnd('/')
    if ($Url -notmatch "^https?://") { $Url = "https://$Url" }
    Set-Content -Path $PublicUrlFile -Value $Url -Encoding UTF8

    # Update .env
    if (Test-Path $EnvFile) {
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
    }
    Write-Host ">>> Public URL: $Url" -ForegroundColor Green
}

# ---------- main ----------
Stop-Existing

# Step 1: Check cloudflared
Write-Step "[1/5] Check cloudflared..."
if (-not (Test-Path $CloudflaredBin)) {
    Write-Host "ERROR: cloudflared.exe not found at $CloudflaredDir" -ForegroundColor Red
    Write-Host "Download from: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
    exit 1
}

# Step 2: Login if needed
Write-Step "[2/5] Check login..."
if (-not (Test-LoggedIn)) {
    Invoke-Login
}

# Step 3: Build
Write-Step "[3/5] Build project..."
$env:PUBLIC_URL = "http://localhost:3000"
$env:NEXTAUTH_URL = "http://localhost:3000"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit 1
}

# Step 4: Start Next.js server
Write-Step "[4/5] Start Next.js server..."
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
Write-Host ">>> Server is running on http://localhost:3000" -ForegroundColor Green

# Step 5: Start Cloudflare Tunnel
Write-Step "[5/5] Start Cloudflare Tunnel..."
Write-Host ">>> Creating tunnel... (this may take a few seconds)" -ForegroundColor Gray

# Start cloudflared in background, capture its output to find the URL
$tunnelProcess = Start-Process -FilePath $CloudflaredBin `
    -ArgumentList "tunnel","--url","http://localhost:3000","--no-autoupdate" `
    -WindowStyle Hidden `
    -PassThru `
    -RedirectStandardOutput $TunnelLog `
    -RedirectStandardError (Join-Path $LogDir "cloudflared.err.log")

# Save PID for later cleanup
$tunnelProcess.Id | Out-File -FilePath $TunnelPidFile -Encoding UTF8

# Wait for tunnel to be established and extract URL
$publicUrl = $null
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 2
    if (Test-Path $TunnelLog) {
        $content = Get-Content $TunnelLog -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
            $publicUrl = $matches[0]
            break
        }
    }
}

if (-not $publicUrl) {
    Write-Host "WARNING: Could not detect tunnel URL automatically." -ForegroundColor Yellow
    Write-Host "Check $TunnelLog for the URL" -ForegroundColor Yellow
} else {
    Set-PublicUrl -Url $publicUrl
}

# ---------- done ----------
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Cloudflare Tunnel 已启动" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
if ($publicUrl) {
    Write-Host "  公网地址: $publicUrl" -ForegroundColor Yellow
} else {
    Write-Host "  查看日志: $TunnelLog" -ForegroundColor Yellow
}
Write-Host "  本地地址: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  停止服务: 关闭本窗口即可" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Green

# Keep the window open and monitor
Write-Host ""
Write-Host "Press Ctrl+C to stop. Monitoring tunnel..." -ForegroundColor Gray

if ($OpenBrowser -and $publicUrl) {
    Start-Process $publicUrl
}

# Stay alive until Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 10
        if ($tunnelProcess.HasExited) {
            Write-Host "WARNING: Tunnel process exited!" -ForegroundColor Red
            break
        }
        if (-not (Test-ServerReady)) {
            Write-Host "WARNING: Local server is no longer responding!" -ForegroundColor Red
        }
    }
} finally {
    Write-Host ">>> Shutting down..." -ForegroundColor Cyan
    Stop-Existing
}
