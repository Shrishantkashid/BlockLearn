@echo off
title Start Mini Project

REM -------------------------
REM Backend Setup
REM -------------------------
cd C:\Users\SHRI\Desktop\BlockLearn\backend

echo Checking backend dependencies...
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
) else (
    echo Backend dependencies are already installed.
)

echo Starting Backend server...
start cmd /k "cd C:\Users\SHRI\Desktop\BlockLearn\backend && npm run dev"

REM -------------------------
REM Frontend Setup
REM -------------------------
cd C:\Users\SHRI\Desktop\BlockLearn\frontend
echo Checking frontend dependencies...
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
) else (
    echo Frontend dependencies are already installed.
)

echo Starting Frontend server...
start cmd /k "cd C:\Users\SHRI\Desktop\BlockLearn\frontend && npm run dev"

echo Both servers are starting...
pause
