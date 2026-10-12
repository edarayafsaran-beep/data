@echo off
cd /d "%~dp0"
color 0a
title Perfect Deploy - Beauty Center System (Firebase Hosting + Firestore)

echo ====================================================================
echo      Deploying Beauty Center System with Database Sync & Rules
echo ====================================================================
echo.

echo [Step 1 of 3] Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo [Step 2 of 3] Building production bundle (dist)...
call npm run build
if %errorlevel% neq 0 (
    echo [Error] Build failed! Please check errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo [Step 3 of 3] Deploying to Firebase Hosting & Firestore Rules...
call npx --yes firebase-tools deploy --only "hosting,firestore" --project beautysantar

echo.
if %errorlevel% equ 0 (
    echo ====================================================================
    echo   [SUCCESS] System is 100% Live and Connected to Firebase Database!
    echo.
    echo   Live Web Links:
    echo   https://beautysantar.web.app
    echo   https://beautysantar.firebaseapp.com
    echo ====================================================================
) else (
    echo.
    echo [Notice] If you see authentication error, please run:
    echo   npx firebase login
    echo Then run this batch file again.
)

echo.
pause
