@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Hay cai Node.js 24 tu https://nodejs.org/ roi mo lai file nay.
 pause
 exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0])===24?0:1)"
if errorlevel 1 (
 echo Game nay can Node.js 24. Phien ban hien tai:
 node --version
 echo Hay cai Node.js 24 tai https://nodejs.org/ roi mo lai file nay.
 pause
 exit /b 1
)
if not exist node_modules (
 call npm ci
 if errorlevel 1 (
  echo Cai dependencies that bai. Kiem tra internet va phien ban Node 24.
  pause
  exit /b 1
 )
)
echo Mo trinh duyet tai http://localhost:3000 sau khi thay Ready.
call npm run dev
pause
