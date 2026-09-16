@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\start-demo.ps1" %*
if errorlevel 1 pause
