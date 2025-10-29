@echo off
echo Eliminando archivos no utilizados...

del "src\pages\Controles.jsx" 2>nul
del "src\pages\ChecksDiarios_backup.jsx" 2>nul  
del "src\pages\Dashboard.jsx.backup" 2>nul
del "src\pages\Movimientos.jsx" 2>nul

echo Archivos eliminados exitosamente.
pause
