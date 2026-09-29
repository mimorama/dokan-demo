@echo off
chcp 65001 > nul
title معرض دكان عبد العزيز للأجهزة الكهربائية
color 0b

echo ================================================================
echo       معرض دكان عبد العزيز للأجهزة الكهربائية والتقسيط
echo                  النسخة المحلية للتشغيل دون إنترنت
echo ================================================================
echo.

:: التحقق من وجود Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [تنبيه هام] برنامج Node.js غير مثبت على هذا الجهاز!
    echo لتشغيل النظام محلياً لأول مرة، يرجى تحميل وتثبيت Node.js من الرابط التالي:
    echo https://nodejs.org
    echo.
    echo بعد تثبيت Node.js اضغط مجدداً على هذا الملف للتشغيل المباشر.
    echo.
    pause
    exit /b 1
)

echo [1/2] جاري تشغيل خادم النظام وقاعدة البيانات المحلية...
echo [2/2] سيتم فتح شاشة البرنامج في المتصفح تلقائياً...
echo.

start /b "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5959"

node server/index.js

pause
