@echo off
echo ===================================================
echo   Beauty Clinic System - Automated Setup & Build
echo ===================================================

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies.
    pause
    exit /b %errorlevel%
)

echo [2/4] Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Build failed.
    pause
    exit /b %errorlevel%
)

echo [3/4] Initializing / Verifying database & collections...
call npx tsx -e "import { initializeApp } from 'firebase/app'; import { getFirestore, collection, getDocs } from 'firebase/firestore'; import cfg from './firebase-applet-config.json'; async function run() { const app = initializeApp(cfg); const db = getFirestore(app); const snap = await getDocs(collection(db, 'branches')); console.log('Firestore connected successfully! Branches found:', snap.size); } run().catch(console.error);"

echo [4/4] Setup complete successfully!
echo You can now start the server using 'npm start' or 'npm run dev'.
echo ===================================================
pause
