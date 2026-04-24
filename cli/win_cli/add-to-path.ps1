#Requires -RunAsAdministrator

#############################################
# Add CIS Hardening Tool to System PATH
#############################################

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     Adding CIS Hardening Tool to System PATH              " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Get the directory where the script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[INFO] Script directory: $scriptDir" -ForegroundColor Blue
Write-Host ""

# Get current system PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Check if already in PATH
if ($currentPath -like "*$scriptDir*") {
    Write-Host "[OK] CIS Hardening Tool is already in the system PATH" -ForegroundColor Green
    Write-Host ""
} else {
    # Add to PATH
    $newPath = $currentPath + ";" + $scriptDir
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    
    Write-Host "[OK] Added to system PATH successfully!" -ForegroundColor Green
    Write-Host ""
}

# Also update current session PATH
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

Write-Host "============================================================" -ForegroundColor Green
Write-Host "[OK] Setup complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "    cis-hardening help" -ForegroundColor White
Write-Host "    cis-hardening audit -ConfigFile [path]" -ForegroundColor White
Write-Host "    cis-hardening fix -ConfigFile [path]" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] You may need to restart PowerShell for changes to take effect" -ForegroundColor Yellow
Write-Host ""
