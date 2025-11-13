#!/bin/bash

# RSP Stories Studio Quick Start Script
# This script sets up the development environment

set -e

echo "=========================================="
echo "  RSP Stories Studio - Quick Start"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js is not installed. Some development features may not work."
fi

echo "✅ Prerequisites check passed"
echo ""

# Set up environment files
echo "Setting up environment files..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created root .env file"
else
    echo "⚠️  Root .env file already exists, skipping..."
fi

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file"
else
    echo "⚠️  Backend .env file already exists, skipping..."
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env file"
else
    echo "⚠️  Frontend .env file already exists, skipping..."
fi

echo ""

# Generate secrets
echo "Would you like to generate secure secrets for JWT? (y/n)"
read -r generate_secrets

if [ "$generate_secrets" = "y" ]; then
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 32)
        JWT_REFRESH_SECRET=$(openssl rand -base64 32)
        
        # Update backend .env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
            sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" backend/.env
        else
            sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
            sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" backend/.env
        fi
        
        echo "✅ Generated and set JWT secrets"
    else
        echo "⚠️  OpenSSL not found, please set JWT secrets manually in backend/.env"
    fi
fi

echo ""

# Install dependencies
echo "Would you like to install Node.js dependencies? (y/n)"
read -r install_deps

if [ "$install_deps" = "y" ]; then
    if command -v node &> /dev/null; then
        echo "Installing backend dependencies..."
        cd backend && npm install && cd ..
        echo "✅ Backend dependencies installed"
        
        echo "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
        echo "✅ Frontend dependencies installed"
    else
        echo "❌ Node.js not found, skipping dependency installation"
    fi
fi

echo ""

# Start services
echo "Starting Docker services..."
docker-compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "Service Status:"
docker-compose ps

echo ""
echo "=========================================="
echo "  ✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Services are now running:"
echo "  • Frontend:  http://localhost:3000"
echo "  • Backend:   http://localhost:5000"
echo "  • Minio:     http://localhost:9001 (minioadmin/minioadmin)"
echo "  • Grafana:   http://localhost:3001 (admin/admin)"
echo "  • Prometheus: http://localhost:9090"
echo ""
echo "Next steps:"
echo "  1. Wait ~30 seconds for all services to initialize"
echo "  2. Run database migrations:"
echo "     cd backend && npx prisma migrate dev"
echo "  3. Open http://localhost:3000 in your browser"
echo "  4. Register a new user account"
echo ""
echo "Useful commands:"
echo "  • View logs:        docker-compose logs -f"
echo "  • Stop services:    docker-compose down"
echo "  • Restart services: docker-compose restart"
echo ""
echo "For more information, see README.md"
echo "=========================================="
