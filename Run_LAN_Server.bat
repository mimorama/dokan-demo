@echo off
chcp 65001 > nul
title Dokan Appliances ERP - Local LAN Server v3.2.0
color 0a

echo =======================================================================
echo          Dokan Appliances Management & POS System
echo                Local Network Server (v3.2.0)
echo =======================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this system!
    echo Please download and install Node.js from: https://nodejs.org
    echo After installing Node.js, run this file again.
    pause
    exit /b 1
)

:: Find Local IPv4 address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo -----------------------------------------------------------------------
echo  [*] Dokan server is active and listening for local connections:
echo.
echo  💻 Access on this Server PC:
echo     http://localhost:5959
echo.
if not "%LOCAL_IP%"=="" (
    echo  📱 Access from Cashier PCs, Tablets, and Phones on the same Wi-Fi:
    echo     http://%LOCAL_IP%:5959
    echo.
)
echo  🔒 Database: dokan.db (High-performance SQLite)
echo  ⚙️  Local Port: 5959
echo -----------------------------------------------------------------------
echo.
echo [!] Opening application in default browser...
echo [!] To stop the server, press Ctrl + C or close this window.
echo.

start /b "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5959"

node server/index.js

echo.
echo [!] Server stopped.
pause
