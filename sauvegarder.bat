@echo off
:: Copyright (c) 2026 Ricardo Ratovoarisoa. Tous droits réservés.

title Sauvegarde Automatique GitHub
color 0B

echo ============================================
echo    SAUVEGARDE AUTOMATIQUE VERS GITHUB
echo ============================================
echo.

echo [1/3] Ajout des fichiers modifies...
git add .
echo       OK.
echo.

echo [2/3] Creation du commit...
:: Demande un message de commit (optionnel)
set /p commit_msg="Entrez un court message pour decrire la modification (ou Entree pour un message automatique) : "

if "%commit_msg%"=="" (
    set commit_msg=Mise a jour automatique du %date% a %time%
)

git commit -m "%commit_msg%"
echo.

echo [3/3] Envoi vers GitHub...
git push origin main
echo.

echo ============================================
echo       SAUVEGARDE TERMINEE AVEC SUCCES !
echo ============================================
echo.
pause
