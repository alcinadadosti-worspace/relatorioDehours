@echo off
chcp 65001 >nul
title Atualizar Dados - Saldo de Horas

echo ========================================
echo    ATUALIZAR DADOS DO RELATORIO
echo ========================================
echo.

:: Verifica se o arquivo RelatorioBancoHoras.xls existe na raiz
if not exist "RelatorioBancoHoras.xls" (
    echo ERRO: Arquivo RelatorioBancoHoras.xls nao encontrado na pasta raiz!
    echo.
    echo Coloque o relatorio exportado do sistema em:
    echo   %cd%\RelatorioBancoHoras.xls
    echo.
    pause
    exit /b 1
)

echo Arquivo encontrado: RelatorioBancoHoras.xls
echo Copiando para public\saldo_por_gestor.xlsx...
echo.

:: Copia o arquivo para a pasta public (o servidor vai servir este arquivo)
copy /Y "RelatorioBancoHoras.xls" "public\saldo_por_gestor.xlsx" >nul
if %errorlevel% neq 0 (
    echo ERRO ao copiar arquivo!
    pause
    exit /b 1
)

echo Arquivo copiado com sucesso.
echo.
echo Enviando para o GitHub...
echo.

:: Adiciona forçando (ignora regras do .gitignore para este arquivo)
git add -f public/saldo_por_gestor.xlsx
if %errorlevel% neq 0 (
    echo ERRO ao adicionar arquivo!
    pause
    exit /b 1
)

git commit -m "Atualiza dados - %date% %time:~0,5%"
if %errorlevel% neq 0 (
    echo.
    echo Nenhuma alteracao detectada no arquivo.
    echo Certifique-se de que substituiu o RelatorioBancoHoras.xls por um mais recente.
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
