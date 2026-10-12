@echo off
cd /d "%~dp0"
color 0a
title Beauty Center System Deployment

echo ====================================================================
echo   Beauty Center System Deployment Tool
echo ====================================================================
echo.

echo [1/4] Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo [2/4] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Please check code errors.
    pause
    exit /b 1
)

echo.
echo [3/4] Preparing Firebase configuration...
copy /y firebase.hosting-only.json firebase.json >nul 2>&1

echo.
echo [4/4] Deploying to Firebase Hosting and Firestore...
call npx --yes firebase-tools deploy --only hosting,firestore --project beautysantar
if %errorlevel% neq 0 (
    echo [NOTICE] If deployment failed, please run: npx firebase login
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo   [SUCCESS] Deployment complete! Live at:
echo   https://beautysantar.web.app
echo ====================================================================
echo.
pause
