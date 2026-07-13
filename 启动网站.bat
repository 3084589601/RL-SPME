@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   贵州民族大学机器人实验室管理系统
echo   一键部署
echo ========================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
pause
