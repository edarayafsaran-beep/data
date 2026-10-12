@echo off
cd /d "%~dp0"
color 0b
title Beauty Center System Setup

echo ====================================================================
echo   Beauty Center System Setup & Hosting
echo ====================================================================
echo.

echo [1/3] Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo [2/3] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Deploying to Firebase...
copy /y firebase.hosting-only.json firebase.json >nul 2>&1
call npx --yes firebase-tools deploy --only hosting,firestore --project beautysantar

echo.
echo ====================================================================
echo   [SUCCESS] Application successfully deployed!
echo   URL: https://beautysantar.web.app
echo ====================================================================
echo.
pause
