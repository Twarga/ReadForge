#!/bin/bash

# RSP Stories Studio Production Deployment Script
# Run this on your VPS to deploy/update the application

set -e

APP_DIR="/opt/rsp-studio"
BACKUP_DIR="/backup"

echo "=========================================="
echo "  RSP Stories Studio - Production Deploy"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Backup database before deployment
echo "Creating database backup..."
if [ -f "$APP_DIR/infra/backup/backup-database.sh" ]; then
    mkdir -p "$BACKUP_DIR"
    bash "$APP_DIR/infra/backup/backup-database.sh"
    echo "✅ Database backed up"
else
    echo "⚠️  Backup script not found, skipping backup"
fi

echo ""

# Pull latest code
echo "Pulling latest code from repository..."
cd "$APP_DIR"
git pull origin main
echo "✅ Code updated"

echo ""

# Pull Docker images
echo "Pulling Docker images..."
docker-compose pull
echo "✅ Images updated"

echo ""

# Restart services
echo "Restarting services..."
docker-compose up -d --build
echo "✅ Services restarted"

echo ""

# Wait for services
echo "Waiting for services to be ready..."
sleep 15

# Run database migrations
echo "Running database migrations..."
docker-compose exec -T backend npx prisma migrate deploy
echo "✅ Migrations completed"

echo ""

# Clean up Docker resources
echo "Cleaning up old Docker resources..."
docker system prune -af --volumes
echo "✅ Cleanup completed"

echo ""

# Health check
echo "Performing health check..."
HEALTH_URL="http://localhost:5000/health"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed (HTTP $HEALTH_RESPONSE)"
    echo "Check logs with: docker-compose logs backend"
    exit 1
fi

echo ""

# Show running services
echo "Service Status:"
docker-compose ps

echo ""
echo "=========================================="
echo "  ✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Application is now running."
echo ""
echo "Useful commands:"
echo "  • View logs:     docker-compose logs -f"
echo "  • Restart:       docker-compose restart"
echo "  • Stop:          docker-compose down"
echo "  • Status:        docker-compose ps"
echo ""
echo "Backups are stored in: $BACKUP_DIR"
echo "=========================================="
