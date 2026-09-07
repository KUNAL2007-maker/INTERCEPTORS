# ==============================================================================
# SIH 2026 Crypto Fraud Attribution System
# One-Click Enterprise Keycloak 24 IAM + PostgreSQL 16 Startup Script
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  🏛️  SIH 2026 ENTERPRISE IDENTITY & ACCESS MANAGEMENT (KEYCLOAK 24 + POSTGRES) " -ForegroundColor Yellow
Write-Host "  Law Enforcement Agency OIDC PKCE Identity Provider (sih-lea realm)            " -ForegroundColor White
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if Docker is installed
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    # Check default Docker Desktop path
    $defaultDockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $defaultDockerPath) {
        Write-Host "[-] Docker CLI is not in system PATH, but Docker Desktop was found at:" -ForegroundColor Yellow
        Write-Host "    $defaultDockerPath" -ForegroundColor White
        Write-Host "[*] Launching Docker Desktop..." -ForegroundColor Cyan
        Start-Process -FilePath $defaultDockerPath
        Write-Host "[!] Please wait for Docker Desktop to finish booting, then re-run this script." -ForegroundColor Yellow
        exit 0
    }

    Write-Host "[!] ERROR: Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "    To install Docker Desktop on Windows, you can either:" -ForegroundColor Yellow
    Write-Host "    1. Run our automated installer script: .\install-docker.ps1" -ForegroundColor Green
    Write-Host "    2. Run with winget: winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements" -ForegroundColor Green
    Write-Host "    3. Or download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Green
    Write-Host ""
    Write-Host "    NOTE: The Next.js platform includes a built-in cryptographic engine" -ForegroundColor Cyan
    Write-Host "    (Zero-Failure Dual-Mode Fallback), allowing full offline evaluation" -ForegroundColor Cyan
    Write-Host "    even without Docker or Keycloak running." -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# 2. Check if Docker daemon is running
Write-Host "[*] Checking Docker daemon status..." -ForegroundColor Cyan
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] ERROR: Docker is installed, but the Docker engine is not running." -ForegroundColor Red
    Write-Host "[*] Attempting to start Docker Desktop..." -ForegroundColor Yellow
    $dockerDesktopExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktopExe) {
        Start-Process -FilePath $dockerDesktopExe
        Write-Host "[*] Waiting up to 60 seconds for Docker daemon to initialize..." -ForegroundColor Cyan
        $retries = 0
        while ($retries -lt 12) {
            Start-Sleep -Seconds 5
            $check = docker info 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[+] Docker daemon successfully connected!" -ForegroundColor Green
                break
            }
            $retries++
            Write-Host "    Still waiting for Docker ($($retries * 5)s)..." -ForegroundColor DarkGray
        }
    } else {
        Write-Host "    Please launch Docker Desktop manually and wait for the green indicator." -ForegroundColor Yellow
        exit 1
    }
}

# 3. Launch docker-compose.keycloak.yml
Write-Host "[*] Spinning up Keycloak 24 and PostgreSQL 16 containers..." -ForegroundColor Cyan
$composeFile = Join-Path $PSScriptRoot "docker-compose.keycloak.yml"
if (-not (Test-Path $composeFile)) {
    $composeFile = Join-Path $PSScriptRoot "docker-compose.yml"
}

docker compose -f $composeFile up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] docker compose up failed. Please check the logs above." -ForegroundColor Red
    exit 1
}

Write-Host "[+] Containers started! Waiting for Keycloak to finish realm import..." -ForegroundColor Green

# 4. Wait for Keycloak healthcheck / realm availability
$realmUrl = "http://localhost:8080/realms/sih-lea"
$maxWait = 45
$waited = 0
$ready = $false

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 3
    $waited += 3
    try {
        $res = Invoke-RestMethod -Uri $realmUrl -TimeoutSec 3 -ErrorAction Stop
        if ($res.realm -eq "sih-lea") {
            $ready = $true
            break
        }
    } catch {
        Write-Host "    Waiting for realm 'sih-lea' to initialize ($($waited)s)..." -ForegroundColor DarkGray
    }
}

Write-Host ""
if ($ready) {
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "  ✅ KEYCLOAK 24 ENTERPRISE IAM IS ONLINE & READY!                              " -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
} else {
    Write-Host "================================================================================" -ForegroundColor Yellow
    Write-Host "  ⚠️  KEYCLOAK IS STILL BOOTING IN THE BACKGROUND (Quarkus JVM warmup)           " -ForegroundColor Yellow
    Write-Host "================================================================================" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Keycloak Admin Console : http://localhost:8080/admin" -ForegroundColor White
Write-Host "  Master Admin Login     : Username: admin | Password: Admin@123" -ForegroundColor DarkCyan
Write-Host "  OIDC Realm             : sih-lea (National Crypto Crime Intelligence Hub)" -ForegroundColor White
Write-Host "  OIDC Discovery URI     : http://localhost:8080/realms/sih-lea/.well-known/openid-configuration" -ForegroundColor White
Write-Host "  Frontend Client ID     : cryptotrace-frontend (Public Client + PKCE S256)" -ForegroundColor White
Write-Host "  Next.js Application    : http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "  Pre-Seeded Enterprise Demo Credentials:" -ForegroundColor Yellow
Write-Host "  ------------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  1. Victim Complainant   : victim.verma@example.demo     | Victim@123" -ForegroundColor White
Write-Host "  2. Cyber Supervisor     : supervisor@example.demo       | Deshmukh@123" -ForegroundColor White
Write-Host "  3. Investigating Officer: investigator@example.demo     | Patil@123" -ForegroundColor White
Write-Host "  4. Senior Investigator  : senior@example.demo           | Police@123" -ForegroundColor White
Write-Host "  5. VASP Compliance Desk : compliance@example.demo       | Compliance@123" -ForegroundColor White
Write-Host "  6. Court Reviewer (BSA) : court@example.demo            | Judge@123" -ForegroundColor White
Write-Host "  7. National Analyst     : national@example.demo         | National@123" -ForegroundColor White
Write-Host "  8. System Administrator : admin@example.demo            | Admin@123" -ForegroundColor White
Write-Host "  ------------------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To view logs: docker compose -f docker-compose.keycloak.yml logs -f keycloak" -ForegroundColor Cyan
Write-Host "  To stop:      docker compose -f docker-compose.keycloak.yml down" -ForegroundColor Cyan
Write-Host ""
