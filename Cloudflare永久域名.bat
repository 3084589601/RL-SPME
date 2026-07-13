@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Robot Lab - Cloudflare Permanent Tunnel

echo.
echo ========================================
echo   贵州民族大学机器人实验室
echo   Cloudflare 永久隧道 - 固定域名
echo ========================================
echo.
echo   已配置域名：gzmzdxwlyjdgcxysys.top
echo   cloudflared\config.yml 已指向该域名。
echo   首次使用还需运行 DNS 路由命令：
echo      cloudflared\cloudflared.exe tunnel route dns robot-lab gzmzdxwlyjdgcxysys.top
echo.
echo   启动需要 1-3 分钟，请耐心等待...
echo ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-cloudflare-permanent.ps1" -OpenBrowser

if errorlevel 1 (
    echo.
    echo [ERROR] 启动失败
    echo.
    pause
    exit /b 1
)

echo.
echo URL 已保存到 public-url.txt
echo.
pause
