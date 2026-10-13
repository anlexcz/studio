@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Nejprve nainstaluj Node.js LTS z https://nodejs.org/
  pause
  exit /b 1
)
node scripts/studio-server.cjs --open
pause
