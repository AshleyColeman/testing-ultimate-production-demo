#!/bin/bash
# 🚀 Ultimate Production Demo - Linux/Mac Setup Script
# This script will set up everything you need to run the demo

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║       🚀 Ultimate Production Demo - Setup Script            ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║       Setting up your testing environment...                ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}➤${NC} ${WHITE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_section() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Start setup
print_header

# Check Node.js
print_step "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION is installed"
else
    print_error "Node.js is not installed!"
    echo -e "  ${YELLOW}Please install Node.js 18 or higher from https://nodejs.org${NC}"
    exit 1
fi

# Check npm
print_step "Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION is installed"
else
    print_error "npm is not installed!"
    exit 1
fi

# Check Docker
print_step "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker is installed: $DOCKER_VERSION"
    
    # Check if Docker is running
    print_step "Checking if Docker is running..."
    if docker ps &> /dev/null; then
        print_success "Docker is running"
    else
        print_error "Docker is not running!"
        echo -e "  ${YELLOW}Please start Docker and try again${NC}"
        echo -e "  ${YELLOW}Download from: https://www.docker.com/products/docker-desktop${NC}"
        exit 1
    fi
else
    print_error "Docker is not installed!"
    echo -e "  ${YELLOW}Please install Docker from https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi

print_section "Installing Dependencies"

# Clean install
print_step "Cleaning previous installations..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    print_success "Removed old node_modules"
fi
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    print_success "Removed old package-lock.json"
fi

# Install dependencies
print_step "Installing npm packages... (this may take a minute)"
if npm install > /dev/null 2>&1; then
    print_success "All dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

print_section "Building TypeScript"

# Build TypeScript
print_step "Compiling TypeScript files..."
if npm run build > /dev/null 2>&1; then
    print_success "TypeScript compiled successfully"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

# Generate Prisma Client
print_step "Generating Prisma Client..."
if npx prisma generate > /dev/null 2>&1; then
    print_success "Prisma Client generated"
else
    print_warning "Prisma Client generation had warnings (this is usually fine)"
fi

print_section "Pre-pulling Docker Images"

# Pull PostgreSQL image
print_step "Pulling PostgreSQL Docker image... (this may take a few minutes)"
if docker pull postgres:16-alpine > /dev/null 2>&1; then
    print_success "PostgreSQL image ready"
else
    print_warning "Could not pre-pull PostgreSQL image (will download on first run)"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║       ✅ Setup Complete!                                     ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}🎉 Your environment is ready!${NC}"
echo ""
echo -e "${CYAN}To run the demo, use one of these commands:${NC}"
echo ""
echo -e "  ${YELLOW}npx vitest run src/__tests__/ultimateProductionDemo.test.ts${NC}"
echo ""
echo -e "${WHITE}This will:${NC}"
echo -e "  ${GRAY}• Start 5 PostgreSQL containers${NC}"
echo -e "  ${GRAY}• Create 20 database schemas${NC}"
echo -e "  ${GRAY}• Load 50 test files${NC}"
echo -e "  ${GRAY}• Execute all 500 tests${NC}"
echo -e "  ${GRAY}• Complete in ~15-20 seconds${NC}"
echo ""
echo -e "${CYAN}📚 Documentation:${NC}"
echo -e "  ${GRAY}• README.md - Quick start guide${NC}"
echo -e "  ${GRAY}• DEMO_READY.md - Complete demo checklist${NC}"
echo -e "  ${GRAY}• ARCHITECTURE_GUIDE.md - Technical deep-dive${NC}"
echo -e "  ${GRAY}• QUICK_REFERENCE.md - Commands and metrics${NC}"
echo ""
echo -e "${GREEN}Happy testing! 🚀${NC}"
echo ""
