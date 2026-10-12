@echo off
cd /d "%~dp0"
color 0a
title Beauty Center System - Deployment & Connection

echo ====================================================================
echo   Beauty Center System: Deployment ^& Database Connection
echo ====================================================================
echo.

echo [1/4] Installing dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [Warning] npm install had warnings, continuing...
)

echo.
echo [2/4] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [Error] Build failed! Please check your code.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Copying firebase configuration...
copy /y firebase.hosting-only.json firebase.json >nul 2>&1

echo.
echo [4/4] Deploying to Firebase Hosting and Firestore...
call npx --yes firebase-tools deploy --only hosting,firestore --project beautysantar

echo.
if %errorlevel% equ 0 (
    echo ====================================================================
    echo   [SUCCESS] Deployment complete! System is live and connected.
    echo   URL: https://beautysantar.web.app
    echo ====================================================================
) else (
    echo [Error] Deployment failed. If not logged in, run: npx firebase login
)

echo.
pause
