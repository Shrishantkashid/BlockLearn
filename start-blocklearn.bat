@echo off
setlocal enabledelayedexpansion
title BlockLearn - Total Startup

:: Get the directory of this script to ensure relative paths work correctly
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo ==========================================
echo       BlockLearn Startup Utility
echo ==========================================
echo Current Directory: %PROJECT_ROOT%

:: Check for root dependencies
if not exist "node_modules\" (
    echo [INFO] Root dependencies missing. Installing...
    call npm install
) else (
    echo [OK] Root dependencies found.
)

:: Check for backend dependencies
if not exist "backend\node_modules\" (
    echo [INFO] Backend dependencies missing. Installing...
    cd backend
    call npm install
    cd ..
) else (
    echo [OK] Backend dependencies found.
)

:: Check for frontend dependencies
if not exist "frontend\node_modules\" (
    echo [INFO] Frontend dependencies missing. Installing...
    cd frontend
    call npm install
    cd ..
) else (
    echo [OK] Frontend dependencies found.
)

echo.
echo Starting all services using concurrently...
echo Press Ctrl+C to stop both servers.
echo.

:: Start the project using root dev script
call npm run dev

pause
