# CIS Windows - Password Policy Configuration
# Implements CIS Controls for Windows Password Policy

Write-Host "=== CIS Windows Password Policy Hardening ===" -ForegroundColor Green
Write-Host "Configuring password policies according to CIS benchmarks..." -ForegroundColor Yellow

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Backup current policy
$backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
Write-Host "Creating backup of current security policy..." -ForegroundColor Yellow
secedit /export /cfg "C:\Windows\security_policy_backup_$backupDate.inf" /quiet

# Create temporary security template
$tempFile = [System.IO.Path]::GetTempFileName() + ".inf"

$securityTemplate = @"
[Unicode]
Unicode=yes
[Version]
signature="`$CHICAGO`$"
Revision=1
[System Access]
MinimumPasswordAge = 1
MaximumPasswordAge = 365
MinimumPasswordLength = 14
PasswordComplexity = 1
PasswordHistorySize = 24
LockoutBadCount = 5
ResetLockoutCount = 15
LockoutDuration = 15
ClearTextPassword = 0
[Registry Values]
"@

# Write template to file
$securityTemplate | Out-File -FilePath $tempFile -Encoding Unicode

Write-Host "Applying CIS password policy settings..." -ForegroundColor Yellow

try {
    # Apply security template
    secedit /configure /db secedit.sdb /cfg $tempFile /areas SECURITYPOLICY /quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Password policy configuration completed successfully!" -ForegroundColor Green
        
        # Display applied settings
        Write-Host "`n📋 Applied Settings:" -ForegroundColor Cyan
        Write-Host "• Minimum password age: 1 day" -ForegroundColor White
        Write-Host "• Maximum password age: 365 days" -ForegroundColor White
        Write-Host "• Minimum password length: 14 characters" -ForegroundColor White
        Write-Host "• Password complexity: Enabled" -ForegroundColor White
        Write-Host "• Password history: 24 passwords" -ForegroundColor White
        Write-Host "• Account lockout threshold: 5 attempts" -ForegroundColor White
        Write-Host "• Account lockout duration: 15 minutes" -ForegroundColor White
        Write-Host "• Reset lockout counter: 15 minutes" -ForegroundColor White
        
        Write-Host "`n📝 Security policy backup saved to: C:\Windows\security_policy_backup_$backupDate.inf" -ForegroundColor Yellow
        Write-Host "🔄 Changes will take effect immediately for new passwords" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Failed to apply security policy!" -ForegroundColor Red
        Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error applying security template: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Clean up temporary file
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}

# Force Group Policy update
Write-Host "`nUpdating Group Policy..." -ForegroundColor Yellow
gpupdate /force /quiet

Write-Host "`n✅ CIS Windows Password Policy hardening completed!" -ForegroundColor Green