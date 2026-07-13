@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Robot Lab - Cloudflare Tunnel

echo.
echo ========================================
echo   贵州民族大学机器人实验室
echo   Cloudflare Tunnel 公网部署
echo ========================================
echo.
echo   首次使用需要登录 Cloudflare 账号
echo   浏览器会自动打开，登录即可
echo.
echo   启动需要 1-3 分钟，请耐心等待...
echo ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-cloudflare.ps1" -OpenBrowser

if errorlevel 1 (
    echo.
    echo [ERROR] 启动失败
    echo 请确认 cloudflared\cloudflared.exe 存在
    echo.
    pause
    exit /b 1
)

echo.
echo URL 已保存到 public-url.txt
echo.
pause
