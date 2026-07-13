@echo off
chcp 936 >nul
cd /d "%~dp0"
title Robot Lab Public Access

echo.
echo ========================================
echo   Lab Website - Public Access
echo ========================================
echo.
echo Starting... Please wait 1-3 minutes.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-public.ps1" -OpenBrowser
if errorlevel 1 (
    echo.
    echo [ERROR] Start failed. Close other npm/next windows and retry.
    pause
    exit /b 1
)

echo.
echo URL saved to public-url.txt
echo Site keeps running after you close this window.
echo.
pause
