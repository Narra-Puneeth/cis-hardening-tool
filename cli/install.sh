#!/bin/bash

#############################################
# CIS Hardening CLI - Installation Script
# Installs the CLI tool system-wide
#############################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

INSTALL_DIR="/usr/local/bin"
SCRIPT_NAME="cis-hardening"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_SCRIPT="${CURRENT_DIR}/usg-hardening-cli.sh"
CONFIG_DIR="/etc/cis-hardening"

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ Error: $1${NC}" >&2; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_step() { echo -e "${CYAN}${BOLD}➜ $1${NC}"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This installation script must be run as root (use sudo)"
        exit 1
    fi
}

check_ubuntu() {
    if [ ! -f /etc/os-release ]; then
        print_error "Cannot detect OS"
        exit 1
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        print_error "This tool is designed for Ubuntu systems only"
        exit 1
    fi
    
    print_info "Detected: $PRETTY_NAME"
}

install_dependencies() {
    print_step "Checking and installing dependencies..."
    
    # Update package list
    print_info "Updating package list..."
    apt update -qq
    
    local packages_to_install=()
    
    # Check if packages are installed
    if ! dpkg -l | grep -q "openscap-common"; then
        packages_to_install+=("openscap-common")
    fi
    
    if ! dpkg -l | grep -q "openscap-scanner"; then
        packages_to_install+=("openscap-scanner")
    fi
    
    if [ ${#packages_to_install[@]} -gt 0 ]; then
        print_info "Installing missing packages: ${packages_to_install[*]}"
        apt install -y "${packages_to_install[@]}"
        print_success "Dependencies installed"
    else
        print_success "All dependencies are already installed"
    fi
}

install_cli_tool() {
    print_step "Installing CIS Hardening CLI tool..."
    
    if [ ! -f "$SOURCE_SCRIPT" ]; then
        print_error "Source script not found: $SOURCE_SCRIPT"
        exit 1
    fi
    
    # Copy the script to install directory
    cp "$SOURCE_SCRIPT" "${INSTALL_DIR}/${SCRIPT_NAME}"
    chmod +x "${INSTALL_DIR}/${SCRIPT_NAME}"
    
    print_success "CLI tool installed to: ${INSTALL_DIR}/${SCRIPT_NAME}"
    
    # Create config directory
    print_step "Setting up configuration directory..."
    mkdir -p "$CONFIG_DIR"
    
    # Copy hardening level config files if they exist
    for level in high medium low; do
        if [ -f "${CURRENT_DIR}/${level}.xml" ]; then
            cp "${CURRENT_DIR}/${level}.xml" "${CONFIG_DIR}/"
            print_info "Installed ${level}.xml config"
        else
            print_warning "${level}.xml not found - skipping"
        fi
    done
    
    print_success "Configuration directory ready: $CONFIG_DIR"
}

verify_installation() {
    print_step "Verifying installation..."
    
    if command -v "$SCRIPT_NAME" >/dev/null 2>&1; then
        print_success "Installation successful!"
        echo ""
        print_info "You can now use the command: ${BOLD}${SCRIPT_NAME}${NC}"
        echo ""
        echo "Try running:"
        echo "  ${SCRIPT_NAME} help"
        echo "  ${SCRIPT_NAME} version"
    else
        print_error "Installation verification failed"
        exit 1
    fi
}

uninstall() {
    print_step "Uninstalling CIS Hardening CLI tool..."
    
    if [ -f "${INSTALL_DIR}/${SCRIPT_NAME}" ]; then
        rm "${INSTALL_DIR}/${SCRIPT_NAME}"
        print_success "CLI tool uninstalled"
    else
        print_info "CLI tool is not installed"
    fi
    
    read -p "Do you want to remove config directory ($CONFIG_DIR)? (yes/no): " remove_config
    if [[ "$remove_config" =~ ^[Yy][Ee][Ss]$ ]]; then
        if [ -d "$CONFIG_DIR" ]; then
            rm -rf "$CONFIG_DIR"
            print_success "Config directory removed"
        fi
    else
        print_info "Config directory preserved"
    fi
}

show_help() {
    echo -e "${BOLD}CIS Hardening CLI - Installation Script${NC}"
    echo ""
    echo -e "${BOLD}USAGE:${NC}"
    echo "    sudo ./install.sh [command]"
    echo ""
    echo -e "${BOLD}COMMANDS:${NC}"
    echo -e "    ${GREEN}install${NC}      Install the CLI tool and dependencies (default)"
    echo -e "    ${GREEN}uninstall${NC}    Remove the CLI tool"
    echo -e "    ${GREEN}reinstall${NC}    Reinstall the CLI tool"
    echo -e "    ${GREEN}deps-only${NC}    Install only dependencies"
    echo -e "    ${GREEN}help${NC}         Show this help message"
    echo ""
    echo -e "${BOLD}EXAMPLES:${NC}"
    echo "    # Install the tool"
    echo "    sudo ./install.sh"
    echo ""
    echo "    # Install only dependencies"
    echo "    sudo ./install.sh deps-only"
    echo ""
    echo "    # Uninstall the tool"
    echo "    sudo ./install.sh uninstall"
    echo ""
    echo "    # Reinstall the tool"
    echo "    sudo ./install.sh reinstall"
    echo ""
    echo -e "${BOLD}NOTES:${NC}"
    echo "    - Requires root privileges (use sudo)"
    echo "    - Installs to: ${INSTALL_DIR}/${SCRIPT_NAME}"
    echo "    - Config directory: ${CONFIG_DIR}"
    echo "    - Place your level XML files (high.xml, medium.xml, low.xml) in the same directory as this script before installation"
    echo ""
}

main() {
    local command="${1:-install}"
    
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║    CIS Hardening CLI - Installation                       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    case "$command" in
        install)
            check_root
            check_ubuntu
            install_dependencies
            install_cli_tool
            verify_installation
            ;;
        uninstall)
            check_root
            uninstall
            ;;
        reinstall)
            check_root
            check_ubuntu
            uninstall
            install_dependencies
            install_cli_tool
            verify_installation
            ;;
        deps-only)
            check_root
            check_ubuntu
            install_dependencies
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
