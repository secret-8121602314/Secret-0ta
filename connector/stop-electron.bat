@echo off
echo Stopping all Electron processes...
taskkill /f /im electron.exe 2>nul
echo.
echo Checking for remaining processes...
tasklist | findstr electron
if %errorlevel% equ 0 (
    echo Some processes may still be running. Try running as Administrator.
) else (
    echo All Electron processes stopped successfully!
)
echo.
pause
