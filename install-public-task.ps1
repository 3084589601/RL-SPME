# Register / remove Windows scheduled task for stable public access on logon
param(
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$TaskName = "RobotLab-PublicAccess"
$StartScript = Join-Path $PSScriptRoot "start-public.ps1"

if (-not (Test-Path $StartScript)) {
    Write-Host "ERROR: start-public.ps1 not found" -ForegroundColor Red
    exit 1
}

if ($Uninstall) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Removed scheduled task: $TaskName" -ForegroundColor Green
    exit 0
}

$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$StartScript`""

$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "Robot lab site - Next.js server with DNSHE domain" `
    -RunLevel Limited | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Auto-start task installed" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Task:   $TaskName" -ForegroundColor Yellow
Write-Host "  Trigger: user logon" -ForegroundColor Yellow
Write-Host "  Script: $StartScript" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Remove task: npm run public:uninstall" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Green
