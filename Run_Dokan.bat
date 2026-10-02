@echo off
chcp 65001 > nul
title Dokan Appliances POS & Installments System - Release v3.2.0
color 0b

echo ================================================================
echo           Dokan Appliances Management & POS System
echo             Local Server & Offline Release v3.2.0
echo ================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this system!
    echo Please download and install Node.js from: https://nodejs.org
    echo After installing Node.js, run this file again.
    echo.
    pause
    exit /b 1
)

:: Check dependencies
if not exist "node_modules" (
    echo [*] Installing production dependencies, please wait...
    call npm install --omit=dev
)

echo [1/2] Launching local server and SQLite database...
echo [2/2] Opening application in default browser...
echo.

start /b "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5959"

node server/index.js

pause