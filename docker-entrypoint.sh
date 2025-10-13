#!/bin/sh
set -e

echo "🚀 Starting Instagram Automation Platform..."

# Wait for database to be ready using DATABASE_URL directly
echo "⏳ Waiting for database..."
until pg_isready -d "$DATABASE_URL" 2>/dev/null; do
  echo "⏳ Database is unavailable - retrying in 2 seconds..."
  sleep 2
done
echo "✅ Database is ready"

# Run database migrations
echo "📦 Running database migrations..."
if npm run db:push; then
  echo "✅ Migrations completed successfully"
else
  if [ "$FORCE_MIGRATIONS" = "true" ]; then
    echo "⚠️  Migration failed, attempting force push (FORCE_MIGRATIONS=true)..."
    npm run db:push -- --force || {
      echo "❌ Migration failed even with --force"
      exit 1
    }
  else
    echo "❌ Migration failed. Set FORCE_MIGRATIONS=true to force push (WARNING: may cause data loss)"
    exit 1
  fi
fi

echo "✅ Startup complete! Starting application..."

# Note: Template seeding happens automatically in the app on first run
# See server/index.ts - it checks if templates exist and seeds them

# Execute the main command
exec "$@"
