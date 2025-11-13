#!/bin/bash

# RSP Studio Database Backup Script
# Run this nightly via cron: 0 2 * * * /opt/rsp-studio/infra/backup/backup-database.sh

set -e

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER="rsp-postgres"
DB_NAME="rsp_studio"
DB_USER="rsp_user"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

echo "[$(date)] Database backup completed: $BACKUP_DIR/db_$DATE.sql.gz"

find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete
echo "[$(date)] Cleaned up old backups (older than 7 days)"

if command -v restic &> /dev/null; then
    restic -r "${RESTIC_REPOSITORY:-/backup/restic}" backup "$BACKUP_DIR" --tag database
    echo "[$(date)] Backup uploaded to Restic repository"
fi

echo "[$(date)] Backup process completed successfully"
