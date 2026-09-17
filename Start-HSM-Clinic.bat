@echo off
chcp 65001 >nul
title HSM Clinic System
cd /d "%~dp0"
if not exist node_modules (
  echo Installing required files for the first time...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
start "" http://127.0.0.1:4173
call npm run dev -- --port 4173
