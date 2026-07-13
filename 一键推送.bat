@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在提交并推送...
git add -A
git commit -m "update" 2>nul
git push origin master
echo 完成！最长 2 分钟后网站自动更新。
pause
