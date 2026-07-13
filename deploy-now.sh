#!/bin/bash
/c/Users/LK/AppData/Local/Microsoft/WinGet/Packages/xhcoding.sshpass-win32_Microsoft.Winget.Source_8wekyb3d8bbwe/sshpass.exe -p "@Lk15761253011" ssh -o StrictHostKeyChecking=no root@121.196.228.254 "cd /opt/robot-lab && git pull origin master && npm install && npm run build && systemctl restart robot-lab && echo 'Deploy OK'"
