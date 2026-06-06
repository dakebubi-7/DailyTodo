@echo off
echo Cleaning Electron processes...
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting development server...
cd app
npm run dev
