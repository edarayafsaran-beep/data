@echo off
cd /d "%~dp0"
color 0a
title 1-Click Clean Deploy - Beauty Center System

echo ====================================================================
echo   Clean Deployment to Firebase Hosting & Firestore
echo ====================================================================
echo.

echo [1/3] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Cleaning apphosting configurations if any...
if exist "apphosting.yaml" del /f /q apphosting.yaml

echo.
echo [3/3] Deploying cleanly to Firebase project: beautysantar...
call npx --yes firebase-tools deploy --only hosting,firestore --project beautysantar

if %errorlevel% equ 0 (
    echo.
    echo ====================================================================
    echo   [SUCCESS] Application is 100% Live and Connected!
    echo   URL: https://beautysantar.web.app
    echo ====================================================================
) else (
    echo.
    echo [NOTICE] If login is needed, run: npx firebase login
)

echo.
pause
