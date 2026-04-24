#!/bin/bash

#############################################
# CIS Hardening CLI Tool
# Multi-Platform System Hardening Tool for Ubuntu
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
SCRIPT_NAME="cis-hardening"
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

get_level_config_file() {
    local level="$1"
    local config_file="${CONFIG_DIR}/${level}.xml"
    
    if [ ! -f "$config_file" ]; then
        print_error "Config file for level '${level}' not found: $config_file"
        echo ""
        echo "Available levels: high, medium, low"
        echo "Expected files:"
        echo "  ${CONFIG_DIR}/high.xml"
        echo "  ${CONFIG_DIR}/medium.xml"
        echo "  ${CONFIG_DIR}/low.xml"
        exit 1
    fi
    
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
    
    s +e
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
    s -e
    
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
    
    print_step "Starting Security Remediation"
    echo ""
    
    print_warning "This will apply security fixes to your system based on the config file"
    print_warning "It is recommended to have a backup before proceeding"
    echo ""
    
    read -p "Do you want to continue? (yes/no): " confirm
    if [[ ! "$confirm" =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Remediation cancelled by user"
        exit 0
    fi
    
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
        print_info "Please run '${SCRIPT_NAME} audit --config-file <file>' after reboot to verify"
        print_info "Remediation log: $remediation_log"
        echo ""
        
        read -p "Do you want to reboot now? (yes/no): " reboot_confirm
        if [[ "$reboot_confirm" =~ ^[Yy][Ee][Ss]$ ]]; then
            print_info "Rebooting system..."
            sleep 2
            reboot
        fi
    else
        echo ""
        print_error "Remediation failed. Please check the output above for details."
        print_info "Remediation log: $remediation_log"
        exit 1
    fi
}

run_generate_report() {
    local results_file="$1"
    
    if [ -z "$results_file" ]; then
        # Use the latest results file
        results_file=$(ls -t ${LOG_DIR}/cis-results-*.xml 2>/dev/null | head -1)
        
        if [ -z "$results_file" ]; then
            print_error "No results file found. Please run an audit first."
            exit 1
        fi
    fi
    
    if [ ! -f "$results_file" ]; then
        print_error "Results file not found: $results_file"
        exit 1
    fi
    
    print_step "Generating HTML report from: $results_file"
    
    local report_file="${results_file%.xml}.html"
    
    oscap xccdf generate report "$results_file" > "$report_file"
    
    print_success "Report generated: $report_file"
}

list_results() {
    print_step "Available audit results and reports in $LOG_DIR:"
    echo ""
    
    if [ ! -d "$LOG_DIR" ] || [ -z "$(ls -A $LOG_DIR 2>/dev/null)" ]; then
        print_warning "No results found. Run an audit first."
        return
    fi
    
    echo -e "${BOLD}XML Results:${NC}"
    ls -lh ${LOG_DIR}/cis-results-*.xml 2>/dev/null | awk '{print "  " $9 " (" $5 ", " $6 " " $7 ")"}' || echo "  None found"
    echo ""
    
    echo -e "${BOLD}HTML Reports:${NC}"
    ls -lh ${LOG_DIR}/cis-report-*.html 2>/dev/null | awk '{print "  " $9 " (" $5 ", " $6 " " $7 ")"}' || echo "  None found"
    echo ""
    
    echo -e "${BOLD}Remediation Logs:${NC}"
    ls -lh ${LOG_DIR}/remediation-*.log 2>/dev/null | awk '{print "  " $9 " (" $5 ", " $6 " " $7 ")"}' || echo "  None found"
    echo ""
    
    echo -e "${BOLD}Remediation Scripts:${NC}"
    ls -lh ${LOG_DIR}/cis-remediation-*.sh 2>/dev/null | awk '{print "  " $9 " (" $5 ", " $6 " " $7 ")"}' || echo "  None found"
}

show_version() {
    echo "$SCRIPT_NAME version $VERSION"
    echo ""
    echo "Checking system components..."
    echo ""
    
    if command -v oscap >/dev/null 2>&1; then
        echo -e "${GREEN}OpenSCAP:${NC} $(oscap --version | head -1)"
    else
        echo -e "${RED}OpenSCAP: Not installed${NC}"
    fi
    
    echo ""
    source /etc/os-release 2>/dev/null && echo "OS: $PRETTY_NAME" || echo "OS: Unknown"
    echo ""
    
    # Show available hardening levels
    if [ -d "$CONFIG_DIR" ]; then
        echo "Available hardening levels:"
        [ -f "${CONFIG_DIR}/high.xml" ] && echo -e "  ${GREEN}✓ high${NC}" || echo -e "  ${RED}✗ high${NC}"
        [ -f "${CONFIG_DIR}/medium.xml" ] && echo -e "  ${GREEN}✓ medium${NC}" || echo -e "  ${RED}✗ medium${NC}"
        [ -f "${CONFIG_DIR}/low.xml" ] && echo -e "  ${GREEN}✓ low${NC}" || echo -e "  ${RED}✗ low${NC}"
    fi
}

show_help() {
    print_banner
    echo -e "${BOLD}USAGE:${NC}"
    echo "    $SCRIPT_NAME <command> [options]"
    echo ""
    echo -e "${BOLD}COMMANDS:${NC}"
    echo -e "    ${GREEN}audit${NC}              Run security compliance audit"
    echo -e "    ${GREEN}fix${NC}                Apply security remediation fixes"
    echo -e "    ${GREEN}harden${NC}             Quick hardening with predefined level (high/medium/low)"
    echo -e "    ${GREEN}list${NC}               List all audit results and reports"
    echo -e "    ${GREEN}report${NC}             Generate HTML report from results"
    echo -e "    ${GREEN}version${NC}            Show version information"
    echo -e "    ${GREEN}help${NC}               Show this help message"
    echo ""
    echo -e "${BOLD}OPTIONS:${NC}"
    echo -e "    ${CYAN}--config-file${NC} <file>       Path to the config XML file (required for audit/fix)"
    echo -e "    ${CYAN}--level${NC} <high|medium|low>  Hardening level (required for harden command)"
    echo -e "    ${CYAN}--results-file${NC} <file>      Path to results XML file (for report generation)"
    echo ""
    echo -e "${BOLD}EXAMPLES:${NC}"
    echo "    # Quick hardening with predefined level"
    echo "    sudo $SCRIPT_NAME harden --level high"
    echo ""
    echo "    # Run a security audit with custom config"
    echo "    sudo $SCRIPT_NAME audit --config-file /path/to/config.xml"
    echo ""
    echo "    # Apply security fixes"
    echo "    sudo $SCRIPT_NAME fix --config-file /path/to/config.xml"
    echo ""
    echo "    # List all results"
    echo "    $SCRIPT_NAME list"
    echo ""
    echo "    # Generate HTML report from specific results"
    echo "    $SCRIPT_NAME report --results-file /var/lib/cis-hardening/cis-results-20251001.1622.xml"
    echo ""
    echo "    # Show version and available levels"
    echo "    $SCRIPT_NAME version"
    echo ""
    echo -e "${BOLD}WORKFLOW:${NC}"
    echo -e "    ${CYAN}Quick Start (Recommended):${NC}"
    echo -e "    ${CYAN}Step 1:${NC} Choose a hardening level and apply it"
    echo "            sudo $SCRIPT_NAME harden --level medium"
    echo -e "    ${CYAN}Step 2:${NC} Reboot if required"
    echo -e "    ${CYAN}Step 3:${NC} Verify the hardening"
    echo "            sudo $SCRIPT_NAME harden --level medium"
    echo ""
    echo -e "    ${CYAN}Advanced (Custom Config):${NC}"
    echo -e "    ${CYAN}Step 1:${NC} Create or obtain a config XML file with your security requirements"
    echo -e "    ${CYAN}Step 2:${NC} Run audit to assess current system compliance"
    echo "            sudo $SCRIPT_NAME audit --config-file config.xml"
    echo -e "    ${CYAN}Step 3:${NC} Review the audit results (HTML report in ${LOG_DIR}/)"
    echo -e "    ${CYAN}Step 4:${NC} Apply fixes to remediate non-compliant settings"
    echo "            sudo $SCRIPT_NAME fix --config-file config.xml"
    echo -e "    ${CYAN}Step 5:${NC} Reboot if required"
    echo -e "    ${CYAN}Step 6:${NC} Run audit again to verify fixes were applied"
    echo "            sudo $SCRIPT_NAME audit --config-file config.xml"
    echo ""
    echo -e "${BOLD}HARDENING LEVELS:${NC}"
    echo -e "    ${GREEN}high${NC}       - Maximum security (CIS Level 2) - Most restrictive"
    echo -e "    ${YELLOW}medium${NC}     - Balanced security (CIS Level 1) - Recommended for most users"
    echo -e "    ${CYAN}low${NC}        - Basic security - Minimal restrictions"
    echo ""
    echo -e "${BOLD}FILES:${NC}"
    echo "    Config Directory: ${CONFIG_DIR}"
    echo "    - high.xml, medium.xml, low.xml : Predefined hardening configs"
    echo "    "
    echo "    Results Directory: ${LOG_DIR}"
    echo "    - cis-results-*.xml       : SCAP results in XML format"
    echo "    - cis-report-*.html       : Human-readable HTML reports"
    echo "    - remediation-*.log       : Remediation execution logs"
    echo "    - cis-remediation-*.sh    : Generated remediation scripts"
    echo ""
    echo -e "${BOLD}REQUIREMENTS:${NC}"
    echo "    - Ubuntu 20.04 or later"
    echo "    - Root privileges (use sudo)"
    echo "    - Packages: openscap-common, openscap-scanner"
    echo ""
    echo -e "${BOLD}NOTES:${NC}"
    echo "    - Always backup your system before applying fixes"
    echo "    - A system reboot may be required after remediation"
    echo "    - Review audit reports before applying fixes"
    echo "    - Start with 'medium' level for production systems"
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
    
    # Handle commands that don't require root or dependency checks
    case "$command" in
        help|--help|-h)
            show_help
            exit 0
            ;;
        version|--version|-v)
            show_version
            exit 0
            ;;
        list)
            list_results
            exit 0
            ;;
    esac
    
    # Parse options
    local config_file=""
    local results_file=""
    local level=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --config-file)
                config_file="$2"
                shift 2
                ;;
            --results-file)
                results_file="$2"
                shift 2
                ;;
            --level)
                level="$2"
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
        harden)
            check_root
            check_ubuntu
            check_dependencies
            ensure_log_dir
            
            # Validate level
            if [ -z "$level" ]; then
                print_error "Hardening level is required"
                echo "Usage: $SCRIPT_NAME harden --level <high|medium|low>"
                exit 1
            fi
            
            if [[ ! "$level" =~ ^(high|medium|low)$ ]]; then
                print_error "Invalid hardening level: $level"
                echo "Valid levels: high, medium, low"
                exit 1
            fi
            
            # Get the config file for the specified level
            config_file=$(get_level_config_file "$level")
            
            print_banner
            print_info "Hardening level: ${BOLD}${level}${NC}"
            echo ""
            
            # Run audit first
            print_step "Step 1/2: Running security audit with ${level} level configuration"
            echo ""
            run_audit "$config_file"
            
            echo ""
            echo ""
            print_step "Step 2/2: Applying security fixes"
            echo ""
            run_fix "$config_file"
            ;;
        report)
            run_generate_report "$results_file"
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
