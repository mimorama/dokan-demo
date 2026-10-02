@echo off
chcp 65001 > nul
title Configure Windows Firewall for Dokan (Port 5959)
color 0e

echo =======================================================================
echo          Allow Port 5959 in Windows Firewall (Inbound TCP)
echo      Permits Cashiers, Tablets and Phones to access Dokan Server
echo =======================================================================
echo.
echo [!] Administrator privileges required (Run as administrator).
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Please right-click this file and choose:
    echo "Run as administrator"
    echo to successfully add the firewall rule.
    echo.
    pause
    exit /b 1
)

echo Adding Windows Defender Firewall inbound rule for Port 5959 (TCP)...
netsh advfirewall firewall add rule name="Dokan Local Server (Port 5959)" dir=in action=allow protocol=TCP localport=5959 >nul

if %errorlevel% equ 0 (
    echo.
    echo [OK] Port 5959 successfully allowed in Windows Firewall!
    echo [OK] Cashier devices and phones on the same Wi-Fi can now connect.
    echo.
) else (
    echo [ERROR] Failed to add firewall rule. Please verify administrator rights.
)

pause
