@echo off
:: Copyright (c) 2026 Ricardo Ratovoarisoa. Tous droits réservés.
:: Ce projet et son code source sont protégés sous licence propriétaire.

title Vocalis AI - Demarrage
color 0A

echo ============================================
echo    VOCALIS AI - Demarrage du serveur local
echo ============================================
echo.

:: Configurer OLLAMA_ORIGINS pour accepter toutes les origines (CORS)
echo [1/3] Configuration de OLLAMA_ORIGINS...
setx OLLAMA_ORIGINS "*" >nul 2>&1
set OLLAMA_ORIGINS=*
echo       OK - CORS configure pour Ollama.
echo.

:: Verifier si Ollama est en cours d'execution
echo [2/3] Verification d'Ollama...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I "ollama.exe" >NUL
if %ERRORLEVEL% == 0 (
    echo       OK - Ollama est en cours d'execution.
) else (
    echo       Ollama n'est pas lance. Tentative de demarrage...
    start "" ollama serve
    timeout /t 3 /nobreak >nul
    echo       Ollama demarre en arriere-plan.
)
echo.

:: Demarrer le serveur backend Dejavu dans une nouvelle fenetre
echo [3/4] Demarrage du serveur Backend (Python)...
start "Vocalis Backend" cmd /k "python dejavu_server.py"
echo       OK - Backend lance.
echo.

:: Demarrer le serveur HTTP local
echo [4/4] Demarrage du serveur HTTP local sur le port 8080...
echo.
echo ============================================
echo   Ouvrez votre navigateur a l'adresse :
echo   http://localhost:8080
echo ============================================
echo.
echo   Appuyez sur Ctrl+C pour arreter le serveur.
echo.

:: Utiliser Python si disponible (il a un serveur HTTP integre)
where python >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo   Serveur demarre avec Python...
    python -m http.server 8080
    goto :eof
)

:: Sinon utiliser PowerShell comme fallback
echo   Serveur demarre avec PowerShell...
powershell -NoProfile -Command "& { $listener = [System.Net.HttpListener]::new(); $listener.Prefixes.Add('http://localhost:8080/'); $listener.Start(); Write-Host 'Serveur HTTP actif sur http://localhost:8080'; while ($listener.IsListening) { $ctx = $listener.GetContext(); $path = $ctx.Request.Url.LocalPath; if ($path -eq '/') { $path = '/index.html' }; $filePath = Join-Path '%~dp0' $path.TrimStart('/'); if (Test-Path $filePath) { $bytes = [System.IO.File]::ReadAllBytes($filePath); $ext = [System.IO.Path]::GetExtension($filePath); $mime = switch ($ext) { '.html' {'text/html; charset=utf-8'} '.css' {'text/css; charset=utf-8'} '.js' {'application/javascript; charset=utf-8'} '.json' {'application/json'} '.png' {'image/png'} '.jpg' {'image/jpeg'} '.svg' {'image/svg+xml'} '.ico' {'image/x-icon'} '.woff2' {'font/woff2'} default {'application/octet-stream'} }; $ctx.Response.ContentType = $mime; $ctx.Response.ContentLength64 = $bytes.Length; $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length) } else { $ctx.Response.StatusCode = 404; $msg = [System.Text.Encoding]::UTF8.GetBytes('404 - Fichier non trouve'); $ctx.Response.OutputStream.Write($msg, 0, $msg.Length) }; $ctx.Response.Close() } }"

pause
