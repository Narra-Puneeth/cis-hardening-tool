#!/bin/bash

#############################################
# CIS Hardening CLI Tool - GUI Version
# Non-Interactive System Hardening Tool for Ubuntu
# (No prompts - designed for GUI integration)
# Version: 1.0.0
#############################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
VERSION="1.0.0"
SCRIPT_NAME="cis-hardening-gui"
LOG_DIR="/var/lib/cis-hardening"
TIMESTAMP=$(date +%Y%m%d.%H%M)
CONFIG_DIR="/etc/cis-hardening"

# Default paths for Ubuntu Security Guide
SSG_BENCHMARK_DIR="/usr/share/ubuntu-scap-security-guides/current/benchmarks"
CPE_DICT="${SSG_BENCHMARK_DIR}/ssg-ubuntu2404-cpe-dictionary.xml"
XCCDF_FILE="${SSG_BENCHMARK_DIR}/ssg-ubuntu2404-xccdf.xml"
DEFAULT_PROFILE="xccdf_org.ssgproject.content_profile_cis_level2_workstation_customized"

#############################################
# Helper Functions
#############################################

print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     CIS Hardening CLI - Ubuntu Security Hardening Tool     ║"
    printf "║%-60s║\n" "                    Version ${VERSION}"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ Error: $1${NC}" >&2
}

print_warning() {
    echo -e "${YELLOW}⚠ Warning: $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_step() {
    echo -e "${CYAN}${BOLD}➜ $1${NC}"
}

#############################################
# Validation Functions
#############################################

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

check_dependencies() {
    local missing_deps=()
    
    # Check for required commands
    command -v oscap >/dev/null 2>&1 || missing_deps+=("openscap-scanner")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        echo ""
        echo "To install missing dependencies, run:"
        echo "  sudo apt update"
        echo "  sudo apt install -y openscap-common openscap-scanner"
        exit 1
    fi
}

check_ubuntu() {
    if [ ! -f /etc/os-release ]; then
        print_error "Cannot detect OS. This tool is for Ubuntu systems only."
        exit 1
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        print_error "This tool is designed for Ubuntu systems only. Detected: $ID"
        exit 1
    fi
    
    print_info "Detected: $PRETTY_NAME"
}

validate_config_file() {
    local config_file="$1"
    
    if [ -z "$config_file" ]; then
        print_error "Config file is required"
        echo "Usage: $SCRIPT_NAME <command> --config-file <path/to/config.xml>"
        exit 1
    fi
    
    if [ ! -f "$config_file" ]; then
        print_error "Config file not found: $config_file"
        exit 1
    fi
    
    # Convert to absolute path
    config_file=$(realpath "$config_file")
    echo "$config_file"
}

ensure_log_dir() {
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        print_info "Created log directory: $LOG_DIR"
    fi
}

#############################################
# Core Functions
#############################################

run_audit() {
    local config_file="$1"
    
    print_step "Starting Security Audit"
    echo ""
    
    local results_file="${LOG_DIR}/cis-results-${TIMESTAMP}.xml"
    local report_file="${LOG_DIR}/cis-report-${TIMESTAMP}.html"
    local raw_output="${LOG_DIR}/cis-audit-raw-${TIMESTAMP}.txt"
    
    print_info "Config file: $config_file"
    print_info "Results will be saved to: $results_file"
    print_info "HTML report will be saved to: $report_file"
    echo ""
    
    # Run the audit using oscap command directly
    print_step "Executing security audit..."
    echo ""
    
    local audit_cmd="oscap xccdf eval --progress --profile ${DEFAULT_PROFILE} --cpe ${CPE_DICT} --results ${results_file} --report ${report_file} --tailoring-file ${config_file} ${XCCDF_FILE}"
    
    # Capture output and format it
    local pass_count=0
    local fail_count=0
    local notapplicable_count=0

    set +e
    # Run audit and capture output
    eval "$audit_cmd" 2>&1 | tee "$raw_output" | while IFS= read -r line; do
        # Check if line contains rule result
        if [[ "$line" =~ xccdf_org\.ssgproject\.content_rule_ ]]; then
            # Extract rule name and result
            local rule=$(echo "$line" | sed 's/xccdf_org\.ssgproject\.content_rule_//' | sed 's/:/ : /')
            local rule_name=$(echo "$rule" | cut -d':' -f1 | tr '_' ' ')
            local result=$(echo "$rule" | cut -d':' -f2 | xargs)
            
            # Format output with colors
            case "$result" in
                pass)
                    echo -e "Rule - ${rule_name} : ${GREEN}pass${NC}"
                    ;;
                fail)
                    echo -e "Rule - ${rule_name} : ${RED}fail${NC}"
                    ;;
                notapplicable)
                    echo -e "Rule - ${rule_name} : notapplicable"
                    ;;
                *)
                    echo "$line"
                    ;;
            esac
        else
            # Print other lines as-is (but skip progress messages if needed)
            if [[ ! "$line" =~ ^[[:space:]]*$ ]]; then
                echo "$line"
            fi
        fi
    done
    
    # Temporarily disable exit on error for count operations
    set +e
    
    # Wait for the command to finish and get exit code
    local exit_code=$?
    
    # Count results from raw output (ensure proper integer values)
    # Use awk to get first number only and ensure it's a valid integer
    pass_count=$(grep -c ":pass$" "$raw_output" 2>/dev/null || echo "0")
    pass_count=$(echo "$pass_count" | head -1 | awk '{print int($1)}')
    pass_count=${pass_count:-0}
    
    fail_count=$(grep -c ":fail$" "$raw_output" 2>/dev/null || echo "0")
    fail_count=$(echo "$fail_count" | head -1 | awk '{print int($1)}')
    fail_count=${fail_count:-0}
    
    notapplicable_count=$(grep -c ":notapplicable$" "$raw_output" 2>/dev/null || echo "0")
    notapplicable_count=$(echo "$notapplicable_count" | head -1 | awk '{print int($1)}')
    notapplicable_count=${notapplicable_count:-0}
    
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BOLD}Audit Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  ${GREEN}Passed:${NC}         $pass_count"
    echo -e "  ${RED}Failed:${NC}         $fail_count"
    echo -e "  Not Applicable: $notapplicable_count"
    echo -e "  ${BOLD}Total Rules:${NC}    $((pass_count + fail_count + notapplicable_count))"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    print_success "Audit completed!"
    echo ""
    print_info "Results and reports are available in: $LOG_DIR"
    print_info "HTML report: $report_file"
    print_info "XML results: $results_file"
}

run_fix() {
    local config_file="$1"
    
    print_step "Starting Security Remediation (Non-Interactive Mode)"
    echo ""
    
    # NO PROMPTS - Auto-proceed with fixes
    print_warning "Applying security fixes automatically (GUI mode - no prompts)"
    echo ""
    
    print_info "Config file: $config_file"
    echo ""
    
    # First run audit to get current state
    print_step "Running pre-remediation audit..."
    local results_file="${LOG_DIR}/cis-results-${TIMESTAMP}.xml"
    oscap xccdf eval --profile ${DEFAULT_PROFILE} --cpe ${CPE_DICT} --results ${results_file} --tailoring-file ${config_file} ${XCCDF_FILE} > /dev/null 2>&1 || true
    
    # Generate remediation script
    print_step "Generating remediation script..."
    local remediation_script="${LOG_DIR}/cis-remediation-${TIMESTAMP}.sh"
    oscap xccdf generate fix --profile ${DEFAULT_PROFILE} --fix-type bash --tailoring-file ${config_file} --output ${remediation_script} ${XCCDF_FILE}
    
    # Execute remediation
    print_step "Applying security fixes..."
    echo ""
    local remediation_log="${LOG_DIR}/remediation-${TIMESTAMP}.log"
    
    if bash -x "$remediation_script" 2>&1 | tee "$remediation_log"; then
        echo ""
        print_success "Remediation completed successfully!"
        echo ""
        print_warning "A system reboot may be required to complete the fix process"
        print_info "Please reboot your system and run audit again to verify"
        print_info "Remediation log: $remediation_log"
        echo ""
        # NO REBOOT PROMPT - Let GUI handle it
        print_info "Reboot is recommended but not automatic in GUI mode"
    else
        echo ""
        print_error "Remediation failed. Please check the output above for details."
        print_info "Remediation log: $remediation_log"
        exit 1
    fi
}

show_help() {
    print_banner
    echo -e "${BOLD}USAGE (GUI Mode - Non-Interactive):${NC}"
    echo "    $SCRIPT_NAME <command> [options]"
    echo ""
    echo -e "${BOLD}COMMANDS:${NC}"
    echo -e "    ${GREEN}audit${NC}              Run security compliance audit"
    echo -e "    ${GREEN}fix${NC}                Apply security remediation fixes (no prompts)"
    echo ""
    echo -e "${BOLD}OPTIONS:${NC}"
    echo -e "    ${CYAN}--config-file${NC} <file>       Path to the config XML file (required)"
    echo ""
    echo -e "${BOLD}EXAMPLES:${NC}"
    echo "    sudo $SCRIPT_NAME audit --config-file /path/to/config.xml"
    echo "    sudo $SCRIPT_NAME fix --config-file /path/to/config.xml"
    echo ""
    echo -e "${BOLD}NOTES:${NC}"
    echo "    - This is the GUI version - no interactive prompts"
    echo "    - Fixes are applied automatically without confirmation"
    echo "    - No automatic reboot - GUI will handle reboot notifications"
    echo "    - Always backup your system before applying fixes"
    echo ""
}

#############################################
# Main Script Logic
#############################################

main() {
    # Parse command
    local command="${1:-}"
    
    if [ -z "$command" ]; then
        show_help
        exit 0
    fi
    
    shift || true
    
    # Handle help
    case "$command" in
        help|--help|-h)
            show_help
            exit 0
            ;;
    esac
    
    # Parse options
    local config_file=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --config-file)
                config_file="$2"
                shift 2
                ;;
            *)
                print_error "Unknown option: $1"
                echo ""
                show_help
                exit 1
                ;;
        esac
    done
    
    # Commands that require root and system checks
    case "$command" in
        audit)
            check_root
            check_ubuntu
            check_dependencies
            ensure_log_dir
            config_file=$(validate_config_file "$config_file")
            print_banner
            run_audit "$config_file"
            ;;
        fix|remediate)
            check_root
            check_ubuntu
            check_dependencies
            ensure_log_dir
            config_file=$(validate_config_file "$config_file")
            print_banner
            run_fix "$config_file"
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
