@echo off
setlocal
cd /d "%~dp0"
if not exist "config.json" copy "config.example.json" "config.json" >nul
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.13.0 or newer is required to run qBit Mobile.
  echo Download Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)
node ".\portable\host.mjs"
pause
