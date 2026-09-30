@echo off
chcp 65001 > nul
title السماح بالاتصال عبر جدار الحماية (Windows Firewall) - منفذ 5959
color 0e

echo =======================================================================
echo          فتح منفذ 5959 في جدار حماية ويندوز (Windows Firewall)
echo       للسماح لأجهزة الكاشير والهواتف بالاتصال بالسيرفر المحلي
echo =======================================================================
echo.
echo [!] يتطلب هذا الإجراء صلاحيات مدير النظام (Run as administrator).
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [تنبيه] يرجى الضغط كليك يمين على هذا الملف واختيار:
    echo "تشغيل كمسؤول" (Run as administrator)
    echo ليتم إضافة قاعدة جدار الحماية بنجاح.
    echo.
    pause
    exit /b 1
)

echo جاري إضافة قاعدة جدار الحماية للمنفذ 5959 (TCP Inbound)...
netsh advfirewall firewall add rule name="Dokan Local Server (Port 5959)" dir=in action=allow protocol=TCP localport=5959 >nul

if %errorlevel% equ 0 (
    echo.
    echo [✓] تم فتح المنفذ 5959 في جدار حماية ويندوز بنجاح!
    echo [✓] الآن يمكن لأي جهاز كاشير أو هاتف على نفس شبكة الواي فاي فتح البرنامج بسهولة.
    echo.
) else (
    echo [!] حدث خطأ أثناء إضافة القاعدة. يرجى التأكد من تشغيل الملف كمسؤول.
)

pause
