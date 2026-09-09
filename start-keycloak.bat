@echo off
setlocal enabledelayedexpansion

echo ================================================================================
echo   SIH 2026 ENTERPRISE IDENTITY ^& ACCESS MANAGEMENT (KEYCLOAK 24 + POSTGRES)
echo   Law Enforcement Agency OIDC PKCE Identity Provider (sih-lea realm)
echo ================================================================================
echo.

where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" (
        set "PATH=%PATH%;C:\Program Files\Docker\Docker\resources\bin"
    )
)

where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        echo [-] Docker CLI not in PATH, but Docker Desktop was found.
        echo [*] Launching Docker Desktop...
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo [!] Please wait for Docker Desktop to finish booting, then re-run this script.
        echo.
        pause
        exit /b 0
    )

    echo [!] ERROR: Docker is not installed or not found in system PATH.
    echo.
    echo     To install Docker Desktop on Windows:
    echo     1. Run automated installer: powershell -ExecutionPolicy Bypass -File .\install-docker.ps1
    echo     2. Or run with winget: winget install -e --id Docker.DockerDesktop
    echo     3. Or download from: https://www.docker.com/products/docker-desktop/
    echo.
    echo     NOTE: The Next.js platform runs seamlessly in offline fallback mode
    echo     without Docker or Keycloak running.
    echo.
    pause
    exit /b 1
)

echo [*] Starting Keycloak 24 and PostgreSQL 16 containers...
if exist "docker-compose.keycloak.yml" (
    docker compose -f docker-compose.keycloak.yml up -d
) else (
    docker compose up -d
)

if %ERRORLEVEL% NEQ 0 (
    echo [!] docker compose command failed. Please ensure Docker Desktop is running.
    pause
    exit /b 1
)

echo.
echo [+] Containers successfully launched!
echo.
echo   Keycloak Admin Console : http://localhost:8080/admin
echo   Master Credentials     : admin / Admin@123
echo   OIDC Realm             : sih-lea
echo   Frontend Web App       : http://localhost:3000
echo.
echo   To stop Keycloak: docker compose -f docker-compose.keycloak.yml down
echo.
pause
