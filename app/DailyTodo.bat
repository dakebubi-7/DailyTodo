@echo off
cd /d "%~dp0"
if exist "%~dp0release\win-unpacked\DailyTodo.exe" (
  start "" "%~dp0release\win-unpacked\DailyTodo.exe"
  exit /b
)

if exist "%~dp0node_modules\electron\dist\electron.exe" (
  start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0"
  exit /b
)

echo DailyTodo.exe not found. Run "bun install" then "bun run dist" first.
pause
exit
