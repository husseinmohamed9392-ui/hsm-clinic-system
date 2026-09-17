@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "PROJECT_DIR=%~dp0.."
set "DRIVE_ROOT="
if exist "%USERPROFILE%\My Drive" set "DRIVE_ROOT=%USERPROFILE%\My Drive"
if not defined DRIVE_ROOT if exist "%USERPROFILE%\Google Drive\My Drive" set "DRIVE_ROOT=%USERPROFILE%\Google Drive\My Drive"
if not defined DRIVE_ROOT exit /b 2
for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set "DATE_STAMP=%%d-%%b-%%c"
for /f "tokens=1-3 delims=:., " %%a in ("%time%") do set "TIME_STAMP=%%a-%%b-%%c"
set "BACKUP_DIR=%DRIVE_ROOT%\HSM-Clinic-Backups\HSM-Clinic-%DATE_STAMP%_%TIME_STAMP%"
mkdir "%BACKUP_DIR%\Program" 2>nul
robocopy "%PROJECT_DIR%" "%BACKUP_DIR%\Program" /E /XD node_modules dist .git /XF .env *.log >nul
for /f "delims=" %%F in ('dir /b /a-d /o-d "%USERPROFILE%\Downloads\HSM-Clinic-Backup-*.json" 2^>nul') do (
  mkdir "%BACKUP_DIR%\Data" 2>nul
  copy /y "%USERPROFILE%\Downloads\%%F" "%BACKUP_DIR%\Data\" >nul
  goto :data_done
)
:data_done
endlocal
