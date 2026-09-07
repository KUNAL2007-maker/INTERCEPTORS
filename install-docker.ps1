# ==============================================================================
# SIH 2026 Crypto Fraud Attribution System
# Automated Docker Desktop Installer Script for Windows 10/11
# ==============================================================================

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  🐳 SIH 2026 - AUTOMATED DOCKER DESKTOP SETUP                                  " -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Check existing installation
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    Write-Host "[+] Docker is already installed in PATH: $(docker --version)" -ForegroundColor Green
    Write-Host "[*] You can start Keycloak now by running: .\start-keycloak.ps1" -ForegroundColor Cyan
    exit 0
}

# Check winget availability
$wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
if (-not $wingetCmd) {
    Write-Host "[!] Winget is not available on this machine." -ForegroundColor Red
    Write-Host "[*] Please download and install Docker Desktop manually from:" -ForegroundColor Yellow
    Write-Host "    https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    exit 1
}

Write-Host "[*] Winget detected. Checking for Docker Desktop package..." -ForegroundColor Cyan
Write-Host "[*] Installing Docker Desktop via Winget (this may take a few minutes)..." -ForegroundColor Yellow
Write-Host "    Package: Docker.DockerDesktop" -ForegroundColor DarkGray

try {
    & winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[+] Docker Desktop installation completed successfully!" -ForegroundColor Green
        Write-Host "[!] NOTE: Windows may require a system restart or logging out to activate WSL2." -ForegroundColor Yellow
        Write-Host "[*] After restart, launch Docker Desktop, then run: .\start-keycloak.ps1" -ForegroundColor Cyan
    } else {
        Write-Host "[!] Winget exited with code $LASTEXITCODE. If administrative permissions are required," -ForegroundColor Yellow
        Write-Host "    please run PowerShell as Administrator and execute this script again." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[!] Installation failed: $_" -ForegroundColor Red
}
