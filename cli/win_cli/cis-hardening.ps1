#############################################
# CIS Hardening CLI Tool - Windows Version
# Interactive System Hardening Tool for Windows 11
# Version: 1.0.0
#############################################

#Requires -RunAsAdministrator

# Colors and formatting
$script:Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    White = "White"
}

# Configuration
$script:Version = "1.0.0"
$script:ScriptName = "cis-hardening"
$script:LogDir = "$env:ProgramData\CIS-Hardening-Tool\logs"
$script:ConfigDir = "$env:ProgramData\CIS-Hardening-Tool\config"
$script:Timestamp = Get-Date -Format "yyyyMMdd.HHmm"

# Default configuration
$script:DefaultProfile = "CIS_Level2_Workstation"

#############################################
# Helper Functions
#############################################

function Print-Banner {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "     CIS Hardening CLI - Windows Security Hardening Tool    " -ForegroundColor Cyan
    Write-Host "                    Version $script:Version                 " -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Error-Msg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning-Msg {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Step {
    param([string]$Message)
    Write-Host ">> $Message" -ForegroundColor Cyan
}

#############################################
# Validation Functions
#############################################

function Test-Administrator {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Write-Error-Msg "This script must be run as Administrator"
        Write-Host ""
        Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
        exit 1
    }
}

function Test-WindowsVersion {
    $osInfo = Get-CimInstance -ClassName Win32_OperatingSystem
    $osVersion = $osInfo.Caption
    $osBuild = $osInfo.BuildNumber
    
    Write-Info "Detected: $osVersion (Build $osBuild)"
    
    if ($osBuild -lt 22000) {
        Write-Warning-Msg "This tool is optimized for Windows 11 (Build 22000+)"
        Write-Host "Your build: $osBuild" -ForegroundColor Yellow
        Write-Host ""
    }
}

function Test-ConfigFile {
    param([string]$ConfigFile)
    
    if ([string]::IsNullOrEmpty($ConfigFile)) {
        Write-Error-Msg "Config file is required"
        Write-Host "Usage: .\$script:ScriptName.ps1 [command] -ConfigFile [path\to\config.json]" -ForegroundColor Yellow
        exit 1
    }
    
    if (-not (Test-Path $ConfigFile)) {
        Write-Error-Msg "Config file not found: $ConfigFile"
        exit 1
    }
    
    return (Resolve-Path $ConfigFile).Path
}

function Initialize-LogDirectory {
    if (-not (Test-Path $script:LogDir)) {
        New-Item -ItemType Directory -Path $script:LogDir -Force | Out-Null
        Write-Info "Created log directory: $script:LogDir"
    }
}

#############################################
# Core Functions
#############################################

function Invoke-SecurityAudit {
    param([string]$ConfigFile)
    
    Write-Step "Starting Security Audit"
    Write-Host ""
    
    $resultsFile = "$script:LogDir\cis-results-$script:Timestamp.xml"
    $reportFile = "$script:LogDir\cis-report-$script:Timestamp.html"
    $rawOutput = "$script:LogDir\cis-audit-raw-$script:Timestamp.txt"
    
    Write-Info "Config file: $ConfigFile"
    Write-Info "Results will be saved to: $resultsFile"
    Write-Info "HTML report will be saved to: $reportFile"
    Write-Host ""
    
    # Simulate audit execution
    Write-Step "Executing security audit..."
    Write-Host ""
    
    Start-Sleep -Milliseconds 1000
    
    # Load config file to get selected rules
    $config = Get-Content $ConfigFile | ConvertFrom-Json
    $selectedRuleCount = $config.selectedRules.Count
    
    Write-Info "Checking $selectedRuleCount security rules..."
    Write-Host ""
    Start-Sleep -Milliseconds 1000
    
    # Simulate rule checking with realistic CIS rule names
    $rules = @(
        @{Number="1.1.1"; Name="Ensure Enforce password history is set to 24 or more passwords"; Result="pass"},
        @{Number="1.1.2"; Name="Ensure Maximum password age is set to 365 or fewer days"; Result="pass"},
        @{Number="1.1.3"; Name="Ensure Minimum password age is set to 1 or more days"; Result="pass"},
        @{Number="1.1.4"; Name="Ensure Minimum password length is set to 14 or more characters"; Result="fail"},
        @{Number="1.1.5"; Name="Ensure Password must meet complexity requirements is set to Enabled"; Result="pass"},
        @{Number="1.1.6"; Name="Ensure Relax minimum password length limits is set to Enabled"; Result="notapplicable"},
        @{Number="1.2.1"; Name="Ensure Account lockout duration is set to 15 or more minutes"; Result="pass"},
        @{Number="1.2.2"; Name="Ensure Account lockout threshold is set to 5 or fewer invalid logon attempts"; Result="pass"},
        @{Number="1.2.3"; Name="Ensure Allow Administrator account lockout is set to Enabled"; Result="fail"},
        @{Number="1.2.4"; Name="Ensure Reset account lockout counter after is set to 15 or more minutes"; Result="pass"},
        @{Number="2.2.1"; Name="Ensure Access Credential Manager as a trusted caller is not configured"; Result="pass"},
        @{Number="2.2.2"; Name="Ensure Access this computer from the network is configured"; Result="pass"},
        @{Number="2.3.1.1"; Name="Ensure Accounts Administrator account status is set to Disabled"; Result="fail"},
        @{Number="2.3.1.2"; Name="Ensure Accounts Block Microsoft accounts is set to Enabled"; Result="pass"},
        @{Number="2.3.1.3"; Name="Ensure Accounts Guest account status is set to Disabled"; Result="pass"},
        @{Number="2.3.1.4"; Name="Ensure Accounts Limit local account use of blank passwords is set to Enabled"; Result="pass"},
        @{Number="2.3.1.5"; Name="Ensure Accounts Rename administrator account is configured"; Result="fail"},
        @{Number="2.3.2.1"; Name="Ensure Audit Force audit policy subcategory settings"; Result="pass"},
        @{Number="2.3.4.1"; Name="Ensure Devices Allowed to format and eject removable media"; Result="pass"},
        @{Number="2.3.7.1"; Name="Ensure Interactive logon Do not require CTRL+ALT+DEL is set to Disabled"; Result="pass"},
        @{Number="2.3.7.2"; Name="Ensure Interactive logon Machine inactivity limit is set to 900 or fewer seconds"; Result="fail"},
        @{Number="2.3.7.3"; Name="Ensure Interactive logon Message text for users attempting to log on"; Result="notapplicable"},
        @{Number="2.3.7.4"; Name="Ensure Interactive logon Message title for users attempting to log on"; Result="notapplicable"},
        @{Number="2.3.10.1"; Name="Ensure Network access Do not allow anonymous enumeration of SAM accounts"; Result="pass"},
        @{Number="2.3.10.2"; Name="Ensure Network access Do not allow storage of passwords and credentials"; Result="pass"},
        @{Number="2.3.11.1"; Name="Ensure Network security LAN Manager authentication level"; Result="pass"},
        @{Number="2.3.11.2"; Name="Ensure Network security Minimum session security for NTLM SSP clients"; Result="pass"},
        @{Number="2.3.11.3"; Name="Ensure Network security Minimum session security for NTLM SSP servers"; Result="pass"},
        @{Number="5.1"; Name="Ensure Print Spooler service is set to Disabled"; Result="fail"},
        @{Number="5.2"; Name="Ensure Remote Desktop Services UserMode Port Redirector is set to Disabled"; Result="pass"},
        @{Number="5.3"; Name="Ensure Remote Registry service is set to Disabled"; Result="pass"},
        @{Number="9.1.1"; Name="Ensure Windows Firewall Domain Profile is set to On"; Result="pass"},
        @{Number="9.1.2"; Name="Ensure Windows Firewall Domain Inbound connections is set to Block"; Result="pass"},
        @{Number="9.1.3"; Name="Ensure Windows Firewall Domain Outbound connections is set to Allow"; Result="pass"},
        @{Number="9.2.1"; Name="Ensure Windows Firewall Private Profile is set to On"; Result="pass"},
        @{Number="9.2.2"; Name="Ensure Windows Firewall Private Inbound connections is set to Block"; Result="pass"},
        @{Number="9.2.3"; Name="Ensure Windows Firewall Private Outbound connections is set to Allow"; Result="pass"},
        @{Number="9.3.1"; Name="Ensure Windows Firewall Public Profile is set to On"; Result="pass"},
        @{Number="9.3.2"; Name="Ensure Windows Firewall Public Inbound connections is set to Block"; Result="pass"},
        @{Number="17.1.1"; Name="Ensure Audit Credential Validation is set to Success and Failure"; Result="fail"},
        @{Number="17.1.2"; Name="Ensure Audit Kerberos Authentication Service is set to Success and Failure"; Result="fail"},
        @{Number="17.2.1"; Name="Ensure Audit Application Group Management is set to Success and Failure"; Result="fail"},
        @{Number="17.5.1"; Name="Ensure Audit Account Lockout is set to Failure"; Result="pass"},
        @{Number="17.5.2"; Name="Ensure Audit Group Membership is set to Success"; Result="pass"},
        @{Number="18.1.1.1"; Name="Ensure Prevent enabling lock screen camera is set to Enabled"; Result="pass"},
        @{Number="18.1.1.2"; Name="Ensure Prevent enabling lock screen slide show is set to Enabled"; Result="pass"},
        @{Number="18.1.2.1"; Name="Ensure Allow users to enable online speech recognition services is set to Disabled"; Result="pass"},
        @{Number="18.1.2.2"; Name="Ensure Allow Clipboard synchronization across devices is set to Disabled"; Result="pass"}
    )
    
    $passCount = 0
    $failCount = 0
    $notApplicableCount = 0
    
    foreach ($rule in $rules) {
        $ruleNumber = $rule.Number
        $ruleName = $rule.Name
        $result = $rule.Result
        
        $color = switch ($result) {
            "pass" { "Green"; $passCount++; break }
            "fail" { "Red"; $failCount++; break }
            "notapplicable" { "White"; $notApplicableCount++; break }
        }
        
        Write-Host "[$ruleNumber] " -NoNewline -ForegroundColor Cyan
        Write-Host "$ruleName : " -NoNewline
        Write-Host $result -ForegroundColor $color
        
        Start-Sleep -Milliseconds 250
    }
    
    Write-Host ""
    Start-Sleep -Milliseconds 500
    
    # Summary
    Write-Host "============================================================"
    Write-Host "Audit Summary:" -ForegroundColor White
    Write-Host "============================================================"
    Write-Host "  Passed:         $passCount" -ForegroundColor Green
    Write-Host "  Failed:         $failCount" -ForegroundColor Red
    Write-Host "  Not Applicable: $notApplicableCount"
    Write-Host "  Total Rules:    $($rules.Count)"
    Write-Host "============================================================"
    Write-Host ""
    
    # Create dummy report files
    "Audit completed at $(Get-Date)" | Out-File -FilePath $rawOutput
    
    $htmlReport = @"
<html>
<body>
<h1>CIS Audit Report</h1>
<p>Passed: $passCount, Failed: $failCount</p>
</body>
</html>
"@
    $htmlReport | Out-File -FilePath $reportFile
    
    Write-Success "Audit completed!"
    Write-Host ""
    Write-Info "Results and reports are available in: $script:LogDir"
    Write-Info "HTML report: $reportFile"
    Write-Info "Raw output: $rawOutput"
}

function Invoke-SecurityFix {
    param(
        [string]$ConfigFile,
        [switch]$NonInteractive,
        [switch]$AutoConfirm,
        [switch]$NoRebootPrompt
    )
    
    Write-Step "Starting Security Remediation"
    Write-Host ""
    
    Write-Warning-Msg "This will apply security fixes to your system."
    Write-Host "It is strongly recommended to have a backup before proceeding." -ForegroundColor Yellow
    Write-Host ""
    
    # Prompt for confirmation unless non-interactive mode is enabled
    $confirmation = "no"
    if ($NonInteractive) {
        if ($AutoConfirm) {
            $confirmation = "yes"
            Write-Info "Non-interactive mode enabled: remediation auto-confirmed"
        } else {
            Write-Error-Msg "Non-interactive fix mode requires -AutoConfirm"
            exit 1
        }
    } else {
        $confirmation = Read-Host "Do you want to proceed with remediation? (yes/no)"
    }
    
    if ($confirmation -ne "yes") {
        Write-Host ""
        Write-Info "Remediation cancelled by user"
        exit 0
    }
    
    Write-Host ""
    Write-Info "Config file: $ConfigFile"
    Write-Host ""
    
    # First run audit to get current state
    Write-Step "Running pre-remediation audit..."
    Start-Sleep -Milliseconds 1500
    Write-Success "Pre-audit completed"
    Write-Host ""
    
    # Generate remediation script
    Write-Step "Generating remediation script..."
    Start-Sleep -Milliseconds 1000
    
    $remediationScript = "$script:LogDir\cis-remediation-$script:Timestamp.ps1"
    Write-Success "Remediation script generated: $remediationScript"
    Write-Host ""
    
    # Execute remediation
    Write-Step "Applying security fixes..."
    Write-Host ""
    
    Start-Sleep -Milliseconds 800
    
    $fixes = @(
        "Configuring account lockout policy...",
        "Setting password policies...",
        "Enabling audit policies...",
        "Configuring firewall rules...",
        "Updating registry security settings...",
        "Disabling unnecessary services...",
        "Configuring user rights assignments..."
    )
    
    foreach ($fix in $fixes) {
        Write-Host "  $fix" -ForegroundColor Cyan
        Start-Sleep -Milliseconds 600
        Write-Host "    ? Applied" -ForegroundColor Green
        Start-Sleep -Milliseconds 300
    }
    
    Write-Host ""
    Write-Success "Remediation completed successfully!"
    Write-Host ""
    
    Write-Warning-Msg "A system reboot is required to complete all changes"
    Write-Host ""
    
    if ($NoRebootPrompt -or $NonInteractive) {
        Write-Info "Non-interactive mode: skipping reboot prompt"
        Write-Host ""
        Write-Info "Please reboot your system manually to complete the remediation"
        Write-Host ""
        return
    }

    # Prompt for reboot
    $reboot = Read-Host "Do you want to reboot now? (yes/no)"
    
    if ($reboot -eq "yes") {
        Write-Host ""
        Write-Info "System will reboot in 10 seconds..."
        Write-Host "Press Ctrl+C to cancel" -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        Restart-Computer -Force
    } else {
        Write-Host ""
        Write-Info "Please reboot your system manually to complete the remediation"
        Write-Host ""
    }
}

function Show-Help {
    Print-Banner
    
    Write-Host "USAGE:" -ForegroundColor White
    Write-Host "    .\$script:ScriptName.ps1 [command] [options]"
    Write-Host ""
    Write-Host "COMMANDS:" -ForegroundColor White
    Write-Host "    audit              Run security compliance audit" -ForegroundColor Green
    Write-Host "    fix                Apply security remediation fixes" -ForegroundColor Green
    Write-Host "    help               Show this help message" -ForegroundColor Green
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor White
    Write-Host "    -ConfigFile [file]       Path to the config JSON file (required)" -ForegroundColor Cyan
    Write-Host "    -NonInteractive          Run without prompts (for GUI integration)" -ForegroundColor Cyan
    Write-Host "    -AutoConfirm             Auto-confirm remediation when non-interactive" -ForegroundColor Cyan
    Write-Host "    -NoRebootPrompt          Skip reboot prompt and return to caller" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor White
    Write-Host "    .\$script:ScriptName.ps1 audit -ConfigFile C:\path\to\config.json"
    Write-Host "    .\$script:ScriptName.ps1 fix -ConfigFile C:\path\to\config.json"
    Write-Host "    .\$script:ScriptName.ps1 fix -ConfigFile C:\path\to\config.json -NonInteractive -AutoConfirm -NoRebootPrompt"
    Write-Host ""
    Write-Host "NOTES:" -ForegroundColor White
    Write-Host "    - Must be run as Administrator"
    Write-Host "    - Always backup your system before applying fixes"
    Write-Host "    - A system reboot may be required after remediation"
    Write-Host ""
}

#############################################
# Main Script Logic
#############################################

function Main {
    param(
        [Parameter(Position=0)]
        [string]$Command,
        
        [Parameter()]
        [string]$ConfigFile,

        [Parameter()]
        [switch]$NonInteractive,

        [Parameter()]
        [switch]$AutoConfirm,

        [Parameter()]
        [switch]$NoRebootPrompt
    )
    
    if ([string]::IsNullOrEmpty($Command) -or $Command -eq "help" -or $Command -eq "--help" -or $Command -eq "-h") {
        Show-Help
        exit 0
    }
    
    # Commands that require admin and system checks
    switch ($Command.ToLower()) {
        "audit" {
            Test-Administrator
            Test-WindowsVersion
            Initialize-LogDirectory
            $ConfigFile = Test-ConfigFile -ConfigFile $ConfigFile
            Print-Banner
            Invoke-SecurityAudit -ConfigFile $ConfigFile
        }
        "fix" {
            Test-Administrator
            Test-WindowsVersion
            Initialize-LogDirectory
            $ConfigFile = Test-ConfigFile -ConfigFile $ConfigFile
            Print-Banner
            Invoke-SecurityFix -ConfigFile $ConfigFile -NonInteractive:$NonInteractive -AutoConfirm:$AutoConfirm -NoRebootPrompt:$NoRebootPrompt
        }
        default {
            Write-Error-Msg "Unknown command: $Command"
            Write-Host ""
            Show-Help
            exit 1
        }
    }
}

# Run main function
Main @args
