@echo off
cd /d "%~dp0"

echo ========================================
echo   Robot Lab - Deploy
echo ========================================
echo.

echo [1/3] Git push...
git add -A
git commit -m "update" 2>nul
git push origin master
if errorlevel 1 (
    echo Push failed!
    pause
    exit /b 1
)
echo Pushed OK.

echo.
echo [2/3] SSH deploy...
sshpass -p "@Lk15761253011" ssh -o StrictHostKeyChecking=no root@121.196.228.254 "cd /opt/robot-lab && bash deploy.sh"
if errorlevel 1 (
    echo.
    echo SSH failed. Check network or server.
    pause
    exit /b 1
)

echo.
echo [3/3] Done!
echo   http://gzmzdxwlyjdgcxysys.top
echo ========================================
timeout /t 5
