# Instagram Automation Platform - Complete Setup Script (Windows)
# This script performs a complete setup with database migration

Write-Host "🚀 Instagram Automation Platform - Complete Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (!(Test-Path .env)) {
    Write-Host "⚠️  No .env file found. Creating from .env.production template..." -ForegroundColor Yellow
    Copy-Item .env.production .env
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Please edit .env file with your credentials before continuing!" -ForegroundColor Yellow
    Write-Host "   Required variables:"
    Write-Host "   - SESSION_SECRET (generate with: openssl rand -hex 32)"
    Write-Host "   - INSTAGRAM_APP_ID"
    Write-Host "   - INSTAGRAM_APP_SECRET"
    Write-Host "   - OAUTH_BASE_URL"
    Write-Host ""
    Read-Host "Press Enter after you've updated .env"
}

# Load environment variables from .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green
Write-Host ""

# Check required variables
$INSTAGRAM_APP_ID = $env:INSTAGRAM_APP_ID
$SESSION_SECRET = $env:SESSION_SECRET

if ([string]::IsNullOrEmpty($INSTAGRAM_APP_ID) -or $INSTAGRAM_APP_ID -eq "your_instagram_app_id") {
    Write-Host "❌ Error: INSTAGRAM_APP_ID not set in .env" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrEmpty($SESSION_SECRET) -or $SESSION_SECRET -eq "CHANGE_ME_TO_RANDOM_HEX_STRING") {
    Write-Host "❌ Error: SESSION_SECRET not set in .env" -ForegroundColor Red
    Write-Host "   Generate one with: openssl rand -hex 32" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "🐳 Starting Docker Compose services..." -ForegroundColor Cyan
docker-compose up -d postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start PostgreSQL" -ForegroundColor Red
    Write-Host "   Make sure Docker Desktop is running" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ PostgreSQL started" -ForegroundColor Green
Write-Host ""

Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $attempt++
    $isReady = docker-compose exec -T postgres pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        break
    }
    Write-Host "   Waiting for database... ($attempt/$maxAttempts)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ Database failed to start" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database is ready" -ForegroundColor Green
Write-Host ""

Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database migration failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database schema created" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the application:"
Write-Host "   npm run dev             # Development mode"
Write-Host "   OR"
Write-Host "   docker-compose up -d    # Full stack with Docker"
Write-Host ""
Write-Host "2. Access the application:"
$port = if ($env:PORT) { $env:PORT } else { "5000" }
Write-Host "   http://localhost:$port"
Write-Host ""
Write-Host "3. Health check:"
Write-Host "   http://localhost:$port/api/health"
Write-Host ""
Write-Host "4. Diagnostic dashboard:"
Write-Host "   http://localhost:$port/api/diagnostic" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Configure Instagram webhooks:"
$oauthUrl = if ($env:OAUTH_BASE_URL) { $env:OAUTH_BASE_URL } else { "http://localhost:$port" }
Write-Host "   - Callback URL: $oauthUrl/api/webhooks/instagram"
$verifyToken = if ($env:INSTAGRAM_WEBHOOK_VERIFY_TOKEN) { $env:INSTAGRAM_WEBHOOK_VERIFY_TOKEN } else { "zenthra" }
Write-Host "   - Verify Token: $verifyToken"
Write-Host ""
Write-Host "6. Optional: Open database UI (Adminer):"
Write-Host "   docker-compose --profile debug up -d adminer"
Write-Host "   Access at: http://localhost:8080"
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
