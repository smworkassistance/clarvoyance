@echo off
rem Double-click this file to open your CEO Brain page.
rem It refreshes the page from the latest files, starts the saving service, and opens the page in your browser.
rem Keep the black window open while you use the page. Close it when you are done.
title CEO Brain (keep this window open)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-dashboard.ps1"
rem Open the page a few seconds later, after the saving service has started.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://127.0.0.1:8765/"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-dashboard.ps1"
