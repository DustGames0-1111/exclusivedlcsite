@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

title Resence local server
echo ========================================
echo   Resence site - local server
echo   http://127.0.0.1:8080/
echo   Login: Resence / admin
echo ========================================
echo.

REM Locate Python
set "PY="
if exist "%LocalAppData%\Python\bin\python.exe" set "PY=%LocalAppData%\Python\bin\python.exe"
if not defined PY if exist "%LocalAppData%\Programs\Python\Python312\python.exe" set "PY=%LocalAppData%\Programs\Python\Python312\python.exe"
if not defined PY if exist "%LocalAppData%\Programs\Python\Python311\python.exe" set "PY=%LocalAppData%\Programs\Python\Python311\python.exe"
if not defined PY if exist "%LocalAppData%\Programs\Python\Python313\python.exe" set "PY=%LocalAppData%\Programs\Python\Python313\python.exe"
if not defined PY (
  where py >nul 2>&1 && set "PY=py"
)
if not defined PY if exist "C:\Windows\py.exe" set "PY=C:\Windows\py.exe"
if not defined PY (
  for /f "delims=" %%I in ('where python 2^>nul') do (
    echo %%I | find /i "WindowsApps" >nul
    if errorlevel 1 if not defined PY set "PY=%%I"
  )
)

if not defined PY (
  echo [ERROR] Python not found.
  echo Install Python 3 from https://www.python.org/downloads/
  echo and enable "Add python.exe to PATH".
  echo.
  pause
  exit /b 1
)

if not exist "%~dp0server.py" (
  echo [ERROR] server.py not found in:
  echo   %~dp0
  pause
  exit /b 1
)

echo Using: %PY%
echo.

REM Free port 8080 if busy
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8080 .*LISTENING"') do (
  echo Port 8080 busy - stopping PID %%P
  taskkill /F /PID %%P >nul 2>&1
)

echo Starting server...
if /I "%PY%"=="py" (
  start "Resence server" /MIN cmd /k "py -3 -u server.py"
) else (
  start "Resence server" /MIN cmd /k ""%PY%" -u server.py"
)

REM Wait until http://127.0.0.1:8080 answers (up to ~20s)
set /a tries=0
:waitloop
set /a tries+=1
curl.exe -s -f -o nul http://127.0.0.1:8080/ >nul 2>&1
if %errorlevel%==0 goto ready
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8080/' -TimeoutSec 1; if ($r.StatusCode -ge 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 goto ready
if %tries% GEQ 20 goto fail
ping -n 2 127.0.0.1 >nul
goto waitloop

:ready
echo Server is up.
echo Opening browser...
start "" "http://127.0.0.1:8080/"
echo.
echo Done. Keep the minimized "Resence server" window open.
echo Close that window ^(or press Ctrl+C there^) to stop the site.
echo.
pause
exit /b 0

:fail
echo [ERROR] Server did not start on port 8080.
echo Open the minimized "Resence server" window and read the error.
echo.
pause
exit /b 1
