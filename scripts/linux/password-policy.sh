#!/bin/bash
# CIS Ubuntu Linux - Password Policy Configuration
# Implements CIS Control 5.3.1, 5.3.2, 5.3.3

echo "=== CIS Linux Password Policy Hardening ==="
echo "Configuring password policies according to CIS benchmarks..."

# Backup original files
cp /etc/login.defs /etc/login.defs.backup.$(date +%Y%m%d)
cp /etc/security/pwquality.conf /etc/security/pwquality.conf.backup.$(date +%Y%m%d)

# Configure password aging in /etc/login.defs
echo "Configuring password aging policies..."
sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS 365/' /etc/login.defs
sed -i 's/^PASS_MIN_DAYS.*/PASS_MIN_DAYS 1/' /etc/login.defs
sed -i 's/^PASS_WARN_AGE.*/PASS_WARN_AGE 7/' /etc/login.defs

# Configure password complexity in /etc/security/pwquality.conf
echo "Configuring password complexity requirements..."
cat >> /etc/security/pwquality.conf << EOF

# CIS Password Policy Configuration
minlen = 14
dcredit = -1
ucredit = -1
ocredit = -1
lcredit = -1
minclass = 4
maxrepeat = 3
maxsequence = 3
gecoscheck = 1
EOF

# Configure PAM for password history
echo "Configuring password history..."
if ! grep -q "remember=5" /etc/pam.d/common-password; then
    sed -i '/pam_pwhistory.so/d' /etc/pam.d/common-password
    sed -i '/pam_unix.so/i password required pam_pwhistory.so remember=5' /etc/pam.d/common-password
fi

# Apply changes to existing users
echo "Applying password aging to existing users..."
for user in $(awk -F: '($3>=1000)&&($1!="nobody"){print $1}' /etc/passwd); do
    chage -M 365 -m 1 -W 7 $user 2>/dev/null
done

echo "✅ Password policy configuration completed!"
echo "📝 Backup files created with .backup.$(date +%Y%m%d) extension"
echo "🔄 Users may need to log out and back in for changes to take effect"