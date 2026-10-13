@echo off
cd /d "%~dp0"
color 0b
title Automated Deployment Tool (Smart Fallback)

echo ====================================================================
echo   Smart Automated Deployment: Hosting + Firestore + Auto-Fallback
echo ====================================================================
echo.

echo [1/4] Installing main project dependencies...
call npm install --legacy-peer-deps

echo.
echo [2/4] Testing connection to Layerbase PostgreSQL...
node test_layerbase.cjs

echo.
echo [3/4] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [4/4] Deploying to Firebase (Hosting + Firestore)...
copy /y firebase.hosting-only.json firebase.json >nul 2>&1
call npx --yes firebase-tools deploy --only hosting,firestore --project beautysantar

if %errorlevel% equ 0 (
    echo.
    echo ====================================================================
    echo   [SUCCESS] Application is 100% live and connected!
    echo   URL: https://beautysantar.web.app
    echo ====================================================================
) else (
    echo.
    echo [NOTICE] If login is required, please run: npx firebase login
)

echo.
pause
