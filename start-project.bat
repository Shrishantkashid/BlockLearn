@echo off
title Start Mini Project

REM -------------------------
REM Backend Setup
REM -------------------------
cd /d C:\Users\Admin\OneDrive\Desktop\mini project 2\Mini-project\backend

echo Checking backend dependencies...
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
) else (
    echo Backend dependencies are already installed.
)

echo Starting Backend server...
start cmd /k "cd /d C:\Users\Admin\OneDrive\Desktop\mini project 2\Mini-project\backend && npm run dev"

REM -------------------------
REM Frontend Setup
REM -------------------------
cd /d C:\Users\Admin\OneDrive\Desktop\mini project 2\Mini-project\frontend
echo Checking frontend dependencies...
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
) else (
    echo Frontend dependencies are already installed.
)

echo Starting Frontend server...
start cmd /k "cd /d C:\Users\Admin\OneDrive\Desktop\mini project 2\Mini-project\frontend && npm run dev"

echo Both servers are starting...
pause
