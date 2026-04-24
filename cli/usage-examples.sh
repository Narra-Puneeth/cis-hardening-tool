#!/bin/bash
# CIS Hardening CLI - Usage Examples
# Copy and paste these commands

# ============================================
# INSTALLATION
# ============================================

# Install everything
sudo ./install.sh

# Install only dependencies
sudo ./install.sh deps-only

# Uninstall
sudo ./install.sh uninstall

# Reinstall
sudo ./install.sh reinstall


# ============================================
# QUICK HARDENING (EASIEST METHOD)
# ============================================

# Apply HIGH security level (maximum security)
sudo cis-hardening harden --level high

# Apply MEDIUM security level (RECOMMENDED for most users)
sudo cis-hardening harden --level medium

# Apply LOW security level (minimal changes)
sudo cis-hardening harden --level low


# ============================================
# MANUAL HARDENING (STEP BY STEP)
# ============================================

# Step 1: Run audit with medium level config
sudo cis-hardening audit --config-file /etc/cis-hardening/medium.xml

# Step 2: Review the report
firefox /var/lib/cis-hardening/cis-report-*.html

# Step 3: Apply fixes
sudo cis-hardening fix --config-file /etc/cis-hardening/medium.xml

# Step 4: Reboot
sudo reboot

# Step 5: Verify fixes were applied
sudo cis-hardening audit --config-file /etc/cis-hardening/medium.xml


# ============================================
# CUSTOM CONFIGURATION
# ============================================

# Use your own config file
sudo cis-hardening audit --config-file /path/to/my-config.xml
sudo cis-hardening fix --config-file /path/to/my-config.xml


# ============================================
# VIEW RESULTS AND INFORMATION
# ============================================

# List all audit results and reports
cis-hardening list

# Show version and available hardening levels
cis-hardening version

# Show help
cis-hardening help

# Generate HTML report from specific results file
cis-hardening report --results-file /var/lib/cis-hardening/cis-results-20251006.1430.xml


# ============================================
# PROGRESSIVE HARDENING APPROACH
# ============================================

# Start with LOW level
sudo cis-hardening harden --level low
sudo reboot
# Test your applications...

# Move to MEDIUM level
sudo cis-hardening harden --level medium
sudo reboot
# Test your applications...

# Apply HIGH level (if needed)
sudo cis-hardening harden --level high
sudo reboot


# ============================================
# FILE LOCATIONS
# ============================================

# Configuration files:
ls -la /etc/cis-hardening/

# Results and reports:
ls -la /var/lib/cis-hardening/

# View latest HTML report:
firefox $(ls -t /var/lib/cis-hardening/cis-report-*.html | head -1)

# View latest remediation log:
cat $(ls -t /var/lib/cis-hardening/remediation-*.log | head -1)


# ============================================
# TROUBLESHOOTING
# ============================================

# Check if tool is installed
which cis-hardening

# Verify dependencies
cis-hardening version

# Check available hardening level configs
ls -la /etc/cis-hardening/*.xml

# View system info
lsb_release -a
oscap --version


# ============================================
# RECOMMENDED WORKFLOW
# ============================================

# For most users, this is all you need:
sudo cis-hardening harden --level medium

# Follow the prompts, reboot if asked, done!
