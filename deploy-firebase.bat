@echo off
cd /d "%~dp0"
color 0b
title Beauty Center System - Setup and Hosting

echo ====================================================================
echo   Beauty Center System: Setup and Hosting Connection
echo ====================================================================
echo.

echo [1/3] Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo [2/3] Building application bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [Error] Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Deploying to Firebase...
copy /y firebase.hosting-only.json firebase.json >nul 2>&1
call npx --yes firebase-tools deploy --only hosting,firestore --project beautysantar

echo.
echo ====================================================================
echo   [SUCCESS] Application is successfully deployed and live!
echo   https://beautysantar.web.app
echo ====================================================================
echo.
pause
