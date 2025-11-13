#!/bin/bash

# Restic Backup Setup Script
# Configures Restic for Backblaze B2 backups

set -e

echo "=== Restic Backup Setup ==="
echo ""

read -p "Enter Backblaze B2 Application Key ID: " B2_KEY_ID
read -sp "Enter Backblaze B2 Application Key: " B2_KEY
echo ""
read -p "Enter Backblaze B2 Bucket Name: " B2_BUCKET
read -sp "Enter Restic Repository Password: " RESTIC_PASSWORD
echo ""

export B2_ACCOUNT_ID="$B2_KEY_ID"
export B2_ACCOUNT_KEY="$B2_KEY"
export RESTIC_REPOSITORY="b2:$B2_BUCKET:rsp-studio-backups"
export RESTIC_PASSWORD="$RESTIC_PASSWORD"

cat > /opt/rsp-studio/.restic-env << EOF
export B2_ACCOUNT_ID="$B2_KEY_ID"
export B2_ACCOUNT_KEY="$B2_KEY"
export RESTIC_REPOSITORY="b2:$B2_BUCKET:rsp-studio-backups"
export RESTIC_PASSWORD="$RESTIC_PASSWORD"
EOF

chmod 600 /opt/rsp-studio/.restic-env

echo "Initializing Restic repository..."
source /opt/rsp-studio/.restic-env
restic init || echo "Repository may already exist"

echo ""
echo "=== Setup Complete ==="
echo "Restic environment saved to: /opt/rsp-studio/.restic-env"
echo ""
echo "To use Restic, run: source /opt/rsp-studio/.restic-env"
echo "Then you can use commands like:"
echo "  restic backup /backup"
echo "  restic snapshots"
echo "  restic restore latest --target /restore"
