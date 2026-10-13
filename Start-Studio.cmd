@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Nejprve nainstaluj Node.js LTS z https://nodejs.org/
  pause
  exit /b 1
)
start "" "http://127.0.0.1:8787/control/"
node scripts/studio-server.cjs
pause
