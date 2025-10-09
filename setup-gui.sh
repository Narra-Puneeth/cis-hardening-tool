#!/bin/bash

#############################################
# CIS Hardening Tool - GUI Setup Script
# Installs dependencies and sets up the application
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        CIS Hardening Tool - GUI Setup Script              ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}➜${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

print_header

# Detect OS
print_step "Detecting operating system..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    print_info "Detected: $PRETTY_NAME"
else
    OS=$(uname -s)
    print_info "Detected: $OS"
fi
echo ""

# Check Node.js
print_step "Checking Node.js installation..."
if check_command node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_warning "Node.js not found"
    echo ""
    echo "Please install Node.js 16 or later:"
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "  sudo apt install -y nodejs"
    else
        echo "  Visit: https://nodejs.org/"
    fi
    exit 1
fi
echo ""

# Check npm
print_step "Checking npm installation..."
if check_command npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found"
    echo "npm should be installed with Node.js"
    exit 1
fi
echo ""

# Check OpenSCAP (Ubuntu only)
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    print_step "Checking OpenSCAP installation (Ubuntu)..."
    if check_command oscap; then
        OSCAP_VERSION=$(oscap --version | head -1)
        print_success "OpenSCAP found: $OSCAP_VERSION"
    else
        print_warning "OpenSCAP not found"
        echo ""
        read -p "Install OpenSCAP now? (y/n): " install_oscap
        if [[ "$install_oscap" =~ ^[Yy]$ ]]; then
            print_step "Installing OpenSCAP..."
            sudo apt update
            sudo apt install -y openscap-scanner openscap-common
            print_success "OpenSCAP installed"
        else
            print_warning "Skipping OpenSCAP installation"
            print_info "Full functionality requires OpenSCAP"
        fi
    fi
    echo ""
fi

# Install npm dependencies
print_step "Installing npm dependencies..."
if [ -f "package.json" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_error "package.json not found"
    print_info "Make sure you're running this script from the project directory"
    exit 1
fi
echo ""

# Create required directories
print_step "Creating required directories..."
mkdir -p config/generated
mkdir -p cli
print_success "Directories created"
echo ""

# Check CLI script
print_step "Checking CLI script..."
if [ -f "cli/usg-hardening-cli.sh" ]; then
    chmod +x cli/usg-hardening-cli.sh
    print_success "CLI script found and made executable"
else
    print_warning "CLI script not found at cli/usg-hardening-cli.sh"
    print_info "Copy your CLI script to the cli/ directory"
fi
echo ""

# Check config files
print_step "Checking configuration files..."
config_ok=true
if [ -f "config/CIS_Ubuntu_Benchmark_MS.json" ]; then
    print_success "Ubuntu config found"
else
    print_warning "Ubuntu config not found: config/CIS_Ubuntu_Benchmark_MS.json"
    config_ok=false
fi

if [ -f "config/windows-11-standalone.json" ]; then
    print_success "Windows config found"
else
    print_warning "Windows config not found: config/windows-11-standalone.json"
    config_ok=false
fi

if [ -f "config/high.xml" ] && [ -f "config/medium.xml" ] && [ -f "config/low.xml" ]; then
    print_success "Preset files found (high/medium/low.xml)"
else
    print_warning "Some preset files missing"
    print_info "Copy high.xml, medium.xml, low.xml to config/ directory"
    config_ok=false
fi

if [ "$config_ok" = false ]; then
    echo ""
    print_warning "Some configuration files are missing"
    print_info "The application may not work correctly without them"
fi
echo ""

# Check GUI files
print_step "Checking GUI files..."
gui_ok=true
if [ -f "cis-index.html" ]; then
    print_success "HTML file found"
else
    print_error "cis-index.html not found"
    gui_ok=false
fi

if [ -f "cis-styles.css" ]; then
    print_success "CSS file found"
else
    print_error "cis-styles.css not found"
    gui_ok=false
fi

if [ -f "cis-renderer.js" ]; then
    print_success "JavaScript file found"
else
    print_error "cis-renderer.js not found"
    gui_ok=false
fi

if [ -f "main.js" ]; then
    print_success "Main process file found"
else
    print_error "main.js not found"
    gui_ok=false
fi

if [ -f "preload.js" ]; then
    print_success "Preload file found"
else
    print_error "preload.js not found"
    gui_ok=false
fi

if [ "$gui_ok" = false ]; then
    echo ""
    print_error "Some GUI files are missing"
    print_info "Make sure all files are in the project directory"
    exit 1
fi
echo ""

# Setup complete
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup Complete!                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_info "Next steps:"
echo ""
echo "  1. Run the application:"
echo "     ${BLUE}npm start${NC}"
echo ""
echo "  2. Or run in development mode (with DevTools):"
echo "     ${BLUE}npm run dev${NC}"
echo ""
echo "  3. Build executable:"
echo "     ${BLUE}npm run build${NC}"
echo ""

if [ "$OS" != "ubuntu" ] && [ "$OS" != "debian" ]; then
    echo ""
    print_warning "Note: You're not on Ubuntu"
    print_info "The application will run in demo mode"
    print_info "Full audit/fix functionality requires Ubuntu with OpenSCAP"
fi

echo ""
print_success "Happy hardening! 🚀🔒"
echo ""
