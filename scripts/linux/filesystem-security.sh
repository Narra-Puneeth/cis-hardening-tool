#!/bin/bash
# CIS Ubuntu Linux - Filesystem Security Configuration
# Implements CIS Controls 1.1.x

echo "=== CIS Linux Filesystem Security Hardening ==="
echo "Configuring filesystem security according to CIS benchmarks..."

# Function to check if mount point exists and configure
configure_mount_options() {
    local mount_point=$1
    local options=$2
    
    if df -h "$mount_point" &>/dev/null; then
        echo "Configuring $mount_point with options: $options"
        
        # Add to /etc/fstab if not already present
        if ! grep -q "$mount_point.*$options" /etc/fstab; then
            # Backup fstab
            cp /etc/fstab /etc/fstab.backup.$(date +%Y%m%d)
            
            # Update mount options
            sed -i "s|\(.*[[:space:]]$mount_point[[:space:]].*[[:space:]]defaults\)|\1,$options|" /etc/fstab
            echo "✅ Updated $mount_point mount options"
        else
            echo "ℹ️  $mount_point already configured with secure options"
        fi
    else
        echo "ℹ️  $mount_point not found, skipping..."
    fi
}

# Configure /tmp with noexec, nosuid, nodev
echo "Securing /tmp filesystem..."
configure_mount_options "/tmp" "noexec,nosuid,nodev"

# Configure /var/tmp with noexec, nosuid, nodev  
echo "Securing /var/tmp filesystem..."
configure_mount_options "/var/tmp" "noexec,nosuid,nodev"

# Configure /home with nodev
echo "Securing /home filesystem..."
configure_mount_options "/home" "nodev"

# Configure /dev/shm with noexec, nosuid, nodev
echo "Securing /dev/shm filesystem..."
if ! grep -q "/dev/shm" /etc/fstab; then
    echo "tmpfs /dev/shm tmpfs defaults,noexec,nosuid,nodev 0 0" >> /etc/fstab
    echo "✅ Added /dev/shm to fstab with secure options"
fi

# Set sticky bit on world-writable directories
echo "Setting sticky bit on world-writable directories..."
df --local -P | awk '{if (NR!=1) print $6}' | xargs -I '{}' find '{}' -xdev -type d \
  \( -perm -0002 -a ! -perm -1000 \) -exec chmod +t {} \; 2>/dev/null

echo "✅ Sticky bit applied to world-writable directories"

# Remove world-writable permissions from system files
echo "Removing world-writable permissions from critical files..."
find /etc -type f -perm -0002 -exec chmod o-w {} \; 2>/dev/null
find /usr -type f -perm -0002 -exec chmod o-w {} \; 2>/dev/null

# Set proper permissions on critical files
chmod 644 /etc/passwd
chmod 600 /etc/shadow
chmod 644 /etc/group
chmod 600 /etc/gshadow
chmod 600 /boot/grub/grub.cfg 2>/dev/null

echo "✅ Filesystem security configuration completed!"
echo "📝 Backup files created with .backup.$(date +%Y%m%d) extension"
echo "🔄 Reboot required for mount option changes to take effect"