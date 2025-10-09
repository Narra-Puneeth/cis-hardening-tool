# CIS Hardening Tool - Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
# Install Node.js and npm (if not already installed)
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# Install Electron dependencies
cd /path/to/cur
npm install
```

### 2. Install OpenSCAP (Ubuntu Only)

```bash
sudo apt update
sudo apt install openscap-scanner openscap-common
```

## Running the Application

### Development Mode (with DevTools)
```bash
npm run dev
```

### Normal Mode
```bash
npm start
```

### Build Executable
```bash
# For your current platform
npm run build

# Platform-specific
npm run build:win     # Windows
npm run build:linux   # Linux
```

## First Time Usage

### Ubuntu Users (Full Functionality)

#### Option 1: Quick Harden (Recommended)
1. **Launch Application**: `npm start`
2. **Click "Quick Harden"** on home page
3. **Select Level**:
   - 🔴 **High**: Maximum security (may impact usability)
   - 🟡 **Medium**: Balanced security (recommended)
   - 🟢 **Low**: Basic security
4. **Run Audit**: Review current compliance
5. **Apply Fixes**: Accept warning and apply

#### Option 2: Custom Configuration
1. **Launch Application**: `npm start`
2. **Click "Get Started"**
3. **Select "Custom"** preset
4. **Choose Rules**: 
   - Use search to find specific rules
   - Filter by severity
   - Click checkboxes to select
5. **Save Config** (optional)
6. **Run Audit** or **Apply Fixes**

### Windows Users (Demo Mode)

1. **Launch Application**: `npm start`
2. **Explore Rules**: Browse Windows CIS benchmarks
3. **Demo Features**:
   - ✅ View all Windows security rules
   - ✅ Search and filter rules
   - ✅ Select rules (UI only)
   - ❌ Audit/Fix show demo message (not executed)

> **Note**: Full audit/fix functionality requires Ubuntu with OpenSCAP

## Understanding the Interface

### Home Page
```
┌─────────────────────────────────────┐
│  Welcome to CIS Hardening Tool      │
│                                     │
│  [Get Started]  [Quick Harden]     │
└─────────────────────────────────────┘
```

### Rule Selection Page
```
┌─────────────────────────────────────┐
│  Hardening Level:                   │
│  [High] [Medium] [Low] [Custom]    │
│                                     │
│  Search: [____________]             │
│  Severity: [All ▼] [Select All]    │
│                                     │
│  ☐ 1.1.1.1 Ensure cramfs...  [LOW] │
│  ☑ 1.1.1.2 Ensure freevxfs... [MED]│
│  ☐ 1.1.1.3 Ensure hfs...     [HIGH]│
│                                     │
│  [Save Config] [Audit] [Fix]       │
└─────────────────────────────────────┘
```

### Audit/Fix Pages
```
┌─────────────────────────────────────┐
│  Security Audit                     │
│                                     │
│  Config: high.xml                   │
│  Level: high                        │
│  Status: Ready                      │
│                                     │
│  ┌─ Terminal Output ─────────────┐ │
│  │ Rule - cramfs disabled : pass │ │
│  │ Rule - freevxfs disabled: fail│ │
│  │ ...                           │ │
│  └───────────────────────────────┘ │
│                                     │
│  [▶ Start Audit]  [Cancel]         │
└─────────────────────────────────────┘
```

## Common Workflows

### Scenario 1: Initial System Hardening

```bash
# 1. Run the application
npm start

# 2. Quick Harden with Medium level
Click: Quick Harden → Medium

# 3. First, audit to see current state
Click: Run Audit → Start Audit

# 4. Review results in terminal output
Check: Pass/Fail counts in summary

# 5. Apply fixes
Click: Back → Run Audit → Apply Fixes
Check: "I understand the risks"
Click: Apply Fixes

# 6. Reboot (if prompted)
Follow on-screen instructions

# 7. Re-audit to verify
Repeat step 3 to confirm fixes applied
```

### Scenario 2: Targeted Hardening

```bash
# 1. Run the application
npm start

# 2. Get Started → Custom preset
Click: Get Started

# 3. Search for specific rules
Type in search: "password"
→ Shows password-related rules

# 4. Select desired rules
Check: Specific security controls

# 5. Save custom configuration
Click: Save Custom Config
→ Generates XML file

# 6. Run audit with custom config
Click: Run Audit → Start Audit

# 7. Apply if satisfied
Click: Back → Apply Fixes
```

### Scenario 3: Compliance Checking

```bash
# 1. Load a preset level
Click: Get Started → High

# 2. Run audit only (no fixes)
Click: Run Audit → Start Audit

# 3. Review results
Check terminal for pass/fail

# 4. Export results (copy output)
Click: Copy button in output terminal

# 5. Generate report
Paste into document for compliance records
```

## Keyboard Shortcuts

- **Ctrl+Shift+I**: Open DevTools (development mode)
- **Ctrl+F**: Focus search box (on selection page)
- **Esc**: Close modal/dialog
- **Ctrl+C**: Copy output (when terminal focused)

## Tips & Best Practices

### Before Running Fixes

✅ **DO:**
- Run audit first to see what will change
- Backup your system
- Test on non-production systems first
- Start with Low or Medium level
- Review each rule before selecting

❌ **DON'T:**
- Run High level on production without testing
- Skip the audit step
- Apply fixes without understanding impact
- Disable all security rules

### For Best Results

1. **Staged Approach**:
   ```
   Low → Test → Medium → Test → High → Test
   ```

2. **Incremental Hardening**:
   - Apply 10-20 rules at a time
   - Test applications after each batch
   - Roll back if issues arise

3. **Documentation**:
   - Copy audit output before fixes
   - Copy audit output after fixes
   - Note any manual changes needed

### Troubleshooting

#### Rules Not Loading
```bash
# Check config files exist
ls config/CIS_Ubuntu_Benchmark_MS.json
ls config/windows-11-standalone.json

# Check file permissions
chmod 644 config/*.json

# Restart application
npm start
```

#### Audit Fails to Start
```bash
# Verify OpenSCAP installed (Ubuntu)
oscap --version

# Check CLI tool exists
ls cli/usg-hardening-cli.sh

# Check CLI executable
chmod +x cli/usg-hardening-cli.sh

# Run CLI directly to test
sudo bash cli/usg-hardening-cli.sh version
```

#### Permission Errors
```bash
# Ensure running with sudo for audit/fix
# Application will prompt when needed

# Check log directory permissions
sudo mkdir -p /var/lib/cis-hardening
sudo chmod 755 /var/lib/cis-hardening

# Check config directory permissions
sudo mkdir -p /etc/cis-hardening
sudo chmod 755 /etc/cis-hardening
```

## Configuration Files

### Generated Files Location

```
config/generated/        # Custom XML configs
/var/lib/cis-hardening/  # Audit results (Ubuntu)
  ├── cis-results-*.xml
  ├── cis-report-*.html
  └── remediation-*.log
```

### Preset Files

```
config/
  ├── high.xml      # CIS Level 2 - Maximum security
  ├── medium.xml    # CIS Level 1 - Balanced
  └── low.xml       # Basic security controls
```

## Advanced Usage

### Custom XML Tailoring

Edit generated XML files in `config/generated/`:

```xml
<!-- Set rule to selected -->
<xccdf:select idref="rule_id" selected="true"/>

<!-- Set rule value -->
<xccdf:set-value idref="value_id">custom_value</xccdf:set-value>
```

### Batch Processing

Run CLI directly for automation:

```bash
# Using generated config
sudo bash cli/usg-hardening-cli.sh audit --config-file config/generated/custom-*.xml

# Using preset
sudo bash cli/usg-hardening-cli.sh harden --level medium
```

### Scheduled Audits

Create cron job:

```bash
# Edit crontab
crontab -e

# Add weekly audit (Sundays at 2 AM)
0 2 * * 0 sudo bash /path/to/cli/usg-hardening-cli.sh audit --config-file /path/to/config.xml
```

## Getting Help

### Check Logs

```bash
# Electron logs
~/.config/CIS\ Hardening\ Tool/logs/

# CLI logs
/var/lib/cis-hardening/

# System logs
journalctl -xe
```

### Debug Mode

```bash
# Run with debug output
npm run dev

# Check DevTools console
Ctrl+Shift+I → Console tab
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "No rules found" | Check config files in `config/` directory |
| "OpenSCAP not found" | Install: `sudo apt install openscap-scanner` |
| "Permission denied" | Run with `sudo` for audit/fix operations |
| "Config generation failed" | Check write permissions in `config/generated/` |
| Demo mode message | Expected on Windows - use Ubuntu for full features |

## Next Steps

1. ✅ **Get Familiar**: Explore the interface in demo mode
2. ✅ **Test on VM**: Try on a test Ubuntu VM first
3. ✅ **Start Small**: Begin with Low or Medium level
4. ✅ **Incremental**: Apply fixes in stages
5. ✅ **Monitor**: Check system functionality after each change
6. ✅ **Document**: Keep records of changes made

## Resources

- **CLI Documentation**: See `CLI-README.md`
- **GUI Architecture**: See `GUI-README.md`
- **CIS Benchmarks**: https://www.cisecurity.org/cis-benchmarks
- **OpenSCAP**: https://www.open-scap.org/

---

**Ready to secure your system? Run `npm start` and click "Get Started"!** 🚀
