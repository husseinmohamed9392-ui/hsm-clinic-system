@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Setup HSM Clinic Backup
set "BACKUP_SCRIPT=%~dp0Backup-HSM-Clinic-to-Google-Drive.bat"
if not exist "%BACKUP_SCRIPT%" (
  echo Backup file not found.
  pause
  exit /b 1
)
schtasks /Create /TN "HSM Clinic Backup Every 12 Hours" /TR "\"%BACKUP_SCRIPT%\"" /SC HOURLY /MO 12 /F
if errorlevel 1 (
  echo Run this file as Administrator and try again.
  pause
  exit /b 1
)
echo Backup task created successfully.
call "%BACKUP_SCRIPT%"
pause
endlocal
