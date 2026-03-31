@echo off
chcp 65001 >nul
title Atualizar Dados - Saldo de Horas

echo ========================================
echo    ATUALIZAR DADOS DO RELATORIO
echo ========================================
echo.

:: Verifica se o arquivo existe na pasta public
if not exist "public\saldo_por_gestor.xlsx" (
    echo ERRO: Arquivo public\saldo_por_gestor.xlsx nao encontrado!
    echo.
    echo Coloque a planilha em: public\saldo_por_gestor.xlsx
    echo.
    pause
    exit /b 1
)

echo Arquivo encontrado: public\saldo_por_gestor.xlsx
echo.
echo Enviando para o GitHub...
echo.

:: Adiciona, commita e envia
git add public/saldo_por_gestor.xlsx
if %errorlevel% neq 0 (
    echo ERRO ao adicionar arquivo!
    pause
    exit /b 1
)

git commit -m "Atualiza dados - %date% %time:~0,5%"
if %errorlevel% neq 0 (
    echo.
    echo Nenhuma alteracao detectada no arquivo.
    echo Certifique-se de que substituiu o arquivo saldo_por_gestor.xlsx
    echo.
    pause
    exit /b 1
)

git push
if %errorlevel% neq 0 (
    echo ERRO ao enviar para GitHub!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    SUCESSO!
echo ========================================
echo.
echo Os dados foram enviados para o GitHub.
echo O Render vai atualizar automaticamente em 2-3 minutos.
echo.
pause
