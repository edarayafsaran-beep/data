@echo off
chcp 65001 > nul
color 0a
title سیستەمی بەڕێوەبردنی سەنتەری جوانکاری - کارپێکردنی خۆکار (Layerbase Sage)

echo ========================================================
echo   سیستەمی بەڕێوەبردنی سەنتەری جوانکاری - کارپێکردنی تەواو
echo   Beauty Center Management System - Automatic Runner
echo ========================================================
echo.

echo [1/4] پشکنین و دروستکردنی فایلی ژینگە (.env) بە داتابەیسی Layerbase Sage...
(
echo DATABASE_URL="postgresql://postgres:VARrUP1de0MZaBqevGejQtpd@van-able-lake-pooler.sage.cloud.layerbase.dev/van?sslmode=require"
echo PORT=3000
echo NODE_ENV=production
) > .env

echo [2/4] دابەزاندنی پاکێجە پێویستەکان (npm install)...
call npm install --legacy-peer-deps

echo [3/4] کۆمپایڵکردن و ئامادەکردنی سیستەم (npm run build)...
call npm run build

echo [4/4] دەستپێکردنی سێرڤەری خۆجێی (Local Server) لەسەر پۆرت 3000...
echo.
echo ========================================================
echo   سیستەمەکە بە سەرکەوتوویی کارا بوو!
echo   تکایە لە وێبگەڕەکەت سەردانی ئەم لینکە بکە:
echo   http://localhost:3000
echo ========================================================
echo.

set DATABASE_URL=postgresql://postgres:VARrUP1de0MZaBqevGejQtpd@van-able-lake-pooler.sage.cloud.layerbase.dev/van?sslmode=require
call npm run start
pause
