@echo off
chcp 65001 > nul
title سيرفر منظومة دكان عبد العزيز - الإصدار v3.2.0 (سيرفر محلي)
color 0a

echo =======================================================================
echo          منظومة دكان عبد العزيز للأجهزة الكهربائية والتقسيط
echo                سيرفر الشبكة المحلية (Local Server v3.2.0)
echo =======================================================================
echo.

:: التحقق من وجود Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ] Node.js غير مثبت على هذا الجهاز!
    echo يرجى تثبيت Node.js من: https://nodejs.org
    echo ثم أعد تشغيل هذا الملف.
    pause
    exit /b 1
)

:: التحقق من تثبيت الاعتماديات
if not exist "node_modules" (
    echo [تهيئة] جاري فحص وتثبيت مكتبات النظام...
    call npm install --omit=dev
)

:: معرفة عنوان IP المحلي للجهاز
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo -----------------------------------------------------------------------
echo  [*] السيرفر يعمل الآن وجاهز لاستقبال الاتصالات:
echo.
echo  💻 رابط الدخول من هذا الجهاز (السيرفر):
echo     http://localhost:5959
echo.
if not "%LOCAL_IP%"=="" (
    echo  📱 رابط الدخول من أجهزة الكاشير والهواتف والتابلت على نفس شبكة الواي فاي:
    echo     http://%LOCAL_IP%:5959
    echo.
)
echo  🔒 قاعدة البيانات: dokan.db (SQLite عالية السرعة مع نسخ احتياطي دوري)
echo  ⚙️  المنفذ المحلي: 5959
echo -----------------------------------------------------------------------
echo.
echo [!] جاري فتح واجهة النظام في المتصفح تلقائياً...
echo [!] لإيقاف السيرفر، أغلق هذه النافذة أو اضغط Ctrl + C.
echo.

start /b "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5959"

node server/index.js

echo.
echo [!] تم إيقاف السيرفر.
pause
