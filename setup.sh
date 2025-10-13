#!/bin/bash

# Instagram Automation Platform - Quick Setup Script
# This script helps you set up the application quickly

set -e

echo "🚀 Instagram Automation Platform - Quick Setup"
echo "================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate random session secret
    SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
    
    # Generate random database password
    DB_PASSWORD=$(openssl rand -hex 16 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    
    # Update .env file
    sed -i.bak "s/your_secure_password_here/$DB_PASSWORD/g" .env
    sed -i.bak "s/your_random_session_secret_here/$SESSION_SECRET/g" .env
    rm -f .env.bak
    
    echo "✅ .env file created with secure random secrets"
    echo ""
    echo "⚠️  IMPORTANT: You still need to configure Instagram OAuth:"
    echo "   1. Open .env file"
    echo "   2. Set INSTAGRAM_APP_ID"
    echo "   3. Set INSTAGRAM_APP_SECRET"
    echo "   4. Set OAUTH_BASE_URL to your domain"
    echo ""
    read -p "Press Enter when you've configured Instagram OAuth credentials..."
else
    echo "ℹ️  .env file already exists, skipping creation"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backups logs

# Pull latest images
echo "📦 Pulling Docker images..."
docker-compose pull

# Build application
echo "🔨 Building application..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "🌐 Application URLs:"
    echo "   - Application: http://localhost:5000"
    echo "   - Database: localhost:5432"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Open http://localhost:5000 in your browser"
    echo "   2. Register a new account"
    echo "   3. Connect your Instagram account"
    echo "   4. Start creating automation flows!"
    echo ""
    echo "📚 Useful Commands:"
    echo "   - View logs: docker-compose logs -f"
    echo "   - Stop: docker-compose down"
    echo "   - Restart: docker-compose restart"
    echo "   - Shell access: docker-compose exec app sh"
    echo ""
else
    echo "❌ Services failed to start. Check logs:"
    echo "   docker-compose logs"
    exit 1
fi
