# Add CIS Hardening Tool Alias to PowerShell Profile

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptPath = Join-Path $scriptDir "cis-hardening.ps1"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     Setting up CIS Hardening Tool Alias                   " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Add alias to PowerShell profile
$profileContent = @"

# CIS Hardening Tool Alias
Set-Alias cis-hardening "$scriptPath"

"@

# Get PowerShell profile path
$profilePath = $PROFILE.CurrentUserAllHosts

Write-Host "[INFO] Script path: $scriptPath" -ForegroundColor Blue
Write-Host "[INFO] Profile path: $profilePath" -ForegroundColor Blue
Write-Host ""

# Create profile if it doesn't exist
if (-not (Test-Path $profilePath)) {
    New-Item -Path $profilePath -ItemType File -Force | Out-Null
    Write-Host "[OK] Created PowerShell profile" -ForegroundColor Green
}

# Check if alias already exists
if (Get-Content $profilePath -ErrorAction SilentlyContinue | Select-String -Pattern "cis-hardening") {
    Write-Host "[INFO] Alias already exists in profile" -ForegroundColor Yellow
    Write-Host ""
} else {
    # Add the alias to profile
    Add-Content -Path $profilePath -Value $profileContent
    Write-Host "[OK] Alias added to PowerShell profile!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Green
Write-Host "[OK] Setup complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "To activate in current session, run:" -ForegroundColor Cyan
Write-Host "    . `$PROFILE" -ForegroundColor White
Write-Host ""
Write-Host "Or restart PowerShell, then you can use:" -ForegroundColor Cyan
Write-Host "    cis-hardening help" -ForegroundColor White
Write-Host "    cis-hardening audit -ConfigFile [path]" -ForegroundColor White
Write-Host "    cis-hardening fix -ConfigFile [path]" -ForegroundColor White
Write-Host ""
Write-Host "To edit your profile manually, run:" -ForegroundColor Cyan
Write-Host "    notepad `$PROFILE" -ForegroundColor White
Write-Host ""
