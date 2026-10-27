@echo off
cd /d "%~dp0"
py -3 --version >nul 2>&1
if not errorlevel 1 (
  py -3 update_albums.py 
  pause
  exit /b
)
python --version >nul 2>&1
if not errorlevel 1 (
  python update_albums.py 
  pause
  exit /b
)
echo Python 3 is nodig. Installeer Python 3 en vink Add Python to PATH aan.
pause
