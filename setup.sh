#!/bin/bash

# Instagram Automation Platform - Complete Setup Script
# This script performs a complete setup with database migration

set -e  # Exit on error

echo "🚀 Instagram Automation Platform - Complete Setup"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.production template..."
    cp .env.production .env
    echo "✅ Created .env file"
    echo ""
    echo "📝 Please edit .env file with your credentials before continuing!"
    echo "   Required variables:"
    echo "   - SESSION_SECRET (generate with: openssl rand -hex 32)"
    echo "   - INSTAGRAM_APP_ID"
    echo "   - INSTAGRAM_APP_SECRET"
    echo "   - OAUTH_BASE_URL"
    echo ""
    read -p "Press Enter after you've updated .env..."
fi

# Load environment variables
set -a
source .env
set +a

echo "✅ Environment variables loaded"
echo ""

# Check required variables
if [ -z "$INSTAGRAM_APP_ID" ] || [ "$INSTAGRAM_APP_ID" = "your_instagram_app_id" ]; then
    echo "❌ Error: INSTAGRAM_APP_ID not set in .env"
    exit 1
fi

if [ -z "$SESSION_SECRET" ] || [ "$SESSION_SECRET" = "CHANGE_ME_TO_RANDOM_HEX_STRING" ]; then
    echo "❌ Error: SESSION_SECRET not set in .env"
    echo "   Generate one with: openssl rand -hex 32"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

echo "🐳 Starting Docker Compose services..."
docker-compose up -d postgres
echo "✅ PostgreSQL started"
echo ""

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

until docker-compose exec -T postgres pg_isready -U ${POSTGRES_USER:-postgres} > /dev/null 2>&1; do
    echo "   Waiting for database..."
    sleep 2
done
echo "✅ Database is ready"
echo ""

echo "🗄️  Running database migrations..."
npm run db:push
echo "✅ Database schema created"
echo ""

echo "🌱 Seeding templates (optional)..."
if [ -f "server/seed-templates.ts" ]; then
    node --import tsx server/seed-templates.ts || echo "⚠️  Templates seeding skipped (non-critical)"
fi
echo ""

echo "🎉 Setup complete!"
echo ""
echo "=================================================="
echo "Next Steps:"
echo "=================================================="
echo ""
echo "1. Start the application:"
echo "   npm run dev             # Development mode"
echo "   OR"
echo "   docker-compose up -d    # Full stack with Docker"
echo ""
echo "2. Access the application:"
echo "   http://localhost:${PORT:-5000}"
echo ""
echo "3. Health check:"
echo "   http://localhost:${PORT:-5000}/api/health"
echo ""
echo "4. Configure Instagram webhooks:"
echo "   - Callback URL: ${OAUTH_BASE_URL:-http://localhost:5000}/api/webhooks/instagram"
echo "   - Verify Token: ${INSTAGRAM_WEBHOOK_VERIFY_TOKEN:-zenthra}"
echo ""
echo "5. Optional: Open database UI (Adminer):"
echo "   docker-compose --profile debug up -d adminer"
echo "   Access at: http://localhost:8080"
echo ""
echo "=================================================="
