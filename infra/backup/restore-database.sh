#!/bin/bash

# RSP Studio Database Restore Script
# Usage: ./restore-database.sh /backup/db_20240101_120000.sql.gz

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER="rsp-postgres"
DB_NAME="rsp_studio"
DB_USER="rsp_user"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "[$(date)] Starting database restore from $BACKUP_FILE..."

read -p "This will overwrite the current database. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "[$(date)] Stopping backend service..."
docker-compose stop backend

echo "[$(date)] Restoring database..."
gunzip < "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

echo "[$(date)] Starting backend service..."
docker-compose start backend

echo "[$(date)] Database restore completed successfully"
