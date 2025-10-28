# Ultimate Production Demo - Windows Setup Script
# This script will set up everything you need to run the demo

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                                                                " -ForegroundColor Cyan
Write-Host "       Ultimate Production Demo - Setup Script                 " -ForegroundColor Cyan
Write-Host "                                                                " -ForegroundColor Cyan
Write-Host "       Setting up your testing environment...                  " -ForegroundColor Cyan
Write-Host "                                                                " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Function to print step
function Print-Step {
    param($message)
    Write-Host "[*] " -NoNewline -ForegroundColor Cyan
    Write-Host $message -ForegroundColor White
}

# Function to print success
function Print-Success {
    param($message)
    Write-Host "[OK] " -NoNewline -ForegroundColor Green
    Write-Host $message -ForegroundColor Green
}

# Function to print error
function Print-Error {
    param($message)
    Write-Host "[ERROR] " -NoNewline -ForegroundColor Red
    Write-Host $message -ForegroundColor Red
}

# Function to print warning
function Print-Warning {
    param($message)
    Write-Host "[WARN] " -NoNewline -ForegroundColor Yellow
    Write-Host $message -ForegroundColor Yellow
}

# Check Node.js
Print-Step "Checking Node.js installation..."
try {
    $nodeVersion = node --version
    Print-Success "Node.js $nodeVersion is installed"
} catch {
    Print-Error "Node.js is not installed!"
    Write-Host "  Please install Node.js 18 or higher from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check npm
Print-Step "Checking npm installation..."
try {
    $npmVersion = npm --version
    Print-Success "npm $npmVersion is installed"
} catch {
    Print-Error "npm is not installed!"
    exit 1
}

# Check Docker
Print-Step "Checking Docker installation..."
try {
    $dockerVersion = docker --version
    Print-Success "Docker is installed: $dockerVersion"
    
    # Check if Docker is running
    Print-Step "Checking if Docker is running..."
    docker ps | Out-Null
    Print-Success "Docker is running"
} catch {
    Print-Error "Docker is not running!"
    Write-Host "  Please start Docker Desktop and try again" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Installing Dependencies" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Clean install
Print-Step "Cleaning previous installations..."
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Print-Success "Removed old node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Print-Success "Removed old package-lock.json"
}

# Install dependencies
Print-Step "Installing npm packages... (this may take a minute)"
try {
    npm install 2>&1 | Out-Null
    Print-Success "All dependencies installed successfully"
} catch {
    Print-Error "Failed to install dependencies"
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Building TypeScript" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Build TypeScript
Print-Step "Compiling TypeScript files..."
try {
    npm run build 2>&1 | Out-Null
    Print-Success "TypeScript compiled successfully"
} catch {
    Print-Error "TypeScript compilation failed"
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Generate Prisma Client
Print-Step "Generating Prisma Client..."
try {
    npx prisma generate 2>&1 | Out-Null
    Print-Success "Prisma Client generated"
} catch {
    Print-Warning "Prisma Client generation had warnings (this is usually fine)"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Pre-pulling Docker Images" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Pull PostgreSQL image
Print-Step "Pulling PostgreSQL Docker image... (this may take a few minutes)"
try {
    docker pull postgres:16-alpine 2>&1 | Out-Null
    Print-Success "PostgreSQL image ready"
} catch {
    Print-Warning "Could not pre-pull PostgreSQL image (will download on first run)"
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                                                                " -ForegroundColor Green
Write-Host "       Setup Complete!                                         " -ForegroundColor Green
Write-Host "                                                                " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Your environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "To run the demo, use this command:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  " -NoNewline
Write-Host "npx vitest run src/__tests__/ultimateProductionDemo.test.ts" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  • Start 5 PostgreSQL containers" -ForegroundColor Gray
Write-Host "  • Create 20 database schemas" -ForegroundColor Gray
Write-Host "  • Load 50 test files" -ForegroundColor Gray
Write-Host "  • Execute all 500 tests" -ForegroundColor Gray
Write-Host "  • Complete in ~15-20 seconds" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  • README.md - Quick start guide" -ForegroundColor Gray
Write-Host "  • DEMO_READY.md - Complete demo checklist" -ForegroundColor Gray
Write-Host "  • ARCHITECTURE_GUIDE.md - Technical deep-dive" -ForegroundColor Gray
Write-Host "  • QUICK_REFERENCE.md - Commands and metrics" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy testing!" -ForegroundColor Green
Write-Host ""
