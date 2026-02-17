@echo off
chcp 65001 >nul
title Atualizar Dados - Relatório de Horas

echo ========================================
echo    ATUALIZAR DADOS DO RELATORIO
echo ========================================
echo.

:: Verifica se o arquivo dados.xlsx existe na pasta public
if not exist "public\dados.xlsx" (
    echo ERRO: Arquivo public\dados.xlsx nao encontrado!
    echo.
    pause
    exit /b 1
)

echo Arquivo encontrado: public\dados.xlsx
echo.
echo Enviando para o GitHub...
echo.

:: Adiciona, commita e envia
git add public/dados.xlsx
if %errorlevel% neq 0 (
    echo ERRO ao adicionar arquivo!
    pause
    exit /b 1
)

git commit -m "Atualiza dados - %date% %time:~0,5%"
if %errorlevel% neq 0 (
    echo.
    echo Nenhuma alteracao detectada no arquivo.
    echo Certifique-se de que substituiu o arquivo dados.xlsx
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
