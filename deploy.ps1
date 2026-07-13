# 贵州民族大学机器人实验室 - 稳定公网一键部署
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ">>> 正在构建项目..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ">>> 启动稳定公网访问..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "start-public.ps1")
