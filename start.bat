@echo off
title WAHA Distribution Engine
color 0A
echo ========================================================
echo   MENYALAKAN WSL, DOCKER, DAN WAHA ENGINE...
echo ========================================================
echo.

:: 1. Nyalakan Docker service di Ubuntu WSL
echo [1/4] Memastikan Docker Service di WSL aktif...
wsl -d Ubuntu -u root service docker start

:: 2. Nyalakan container WAHA
echo [2/4] Menyalakan container WAHA WhatsApp Gateway...
wsl -d Ubuntu -u root docker start waha

:: 3. Bersihkan port 5000 jika ada proses lama
echo [3/4] Menyiapkan port server...
wsl -d Ubuntu -u root sh -c "fuser -k 5000/tcp 2>/dev/null || true"

:: 4. Buka Browser Dashboard
echo [4/4] Membuka Dashboard di Browser...
start http://localhost:5000/

echo.
echo ========================================================
echo   SERVER ENGINE BERJALAN! JANGAN TUTUP JENDELA INI
echo ========================================================
echo.

:: Jalankan Node.js server bot
wsl -d Ubuntu -u root sh -c "cd /mnt/d/AI/wa-distribution-engine && node src/index.js"

pause
