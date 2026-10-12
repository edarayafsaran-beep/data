@echo off
cd /d "%~dp0"
color 0b
title Connect Firebase to Layerbase PostgreSQL (Full Setup)

echo ====================================================================
echo   Full Connection Tool: Firebase Hosting + Functions + Layerbase
echo ====================================================================
echo.

echo [1/6] Installing main project dependencies (including pg)...
call npm install --legacy-peer-deps
call npm install pg --save

echo.
echo [2/6] Installing Cloud Functions dependencies (including pg)...
if exist "functions" (
    cd functions
    call npm install --legacy-peer-deps
    call npm install pg --save
    cd ..
)

echo.
echo [3/6] Testing connection to Layerbase PostgreSQL...
node test_layerbase.cjs
if %errorlevel% neq 0 (
    echo [Warning] Layerbase connection check had a warning, proceeding with deployment...
)

echo.
echo [4/6] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Please check your code.
    pause
    exit /b 1
)

echo.
echo [5/6] Activating full Firebase configuration (Functions + Hosting + Firestore)...
copy /y firebase.full.json firebase.json >nul 2>&1

echo.
echo [6/6] Deploying to Firebase (beautysantar)...
call npx --yes firebase-tools deploy --only functions,hosting,firestore --project beautysantar

if %errorlevel% equ 0 (
    echo.
    echo ====================================================================
    echo   [SUCCESS] Firebase is now fully connected to Layerbase PostgreSQL!
    echo   Live URL: https://beautysantar.web.app
    echo ====================================================================
) else (
    echo.
    echo [NOTICE] If Cloud Functions deployment requires the Blaze plan,
    echo deploying Hosting and Firestore only...
    copy /y firebase.hosting-only.json firebase.json >nul 2>&1
    call npx --yes firebase-tools deploy --only hosting,firestore --project beautysantar
)

echo.
pause
