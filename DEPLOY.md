# 🚀 Complete Docker Compose Deployment Guide

## Overview

This project now includes **complete Docker Compose setup** with:
- ✅ Automatic PostgreSQL database setup
- ✅ Automatic database migrations
- ✅ One-command deployment
- ✅ Automatic webhook subscription
- ✅ Health checks and diagnostics
- ✅ Optional database UI (Adminer)
- ✅ Production-ready configuration

---

## Quick Start (Windows)

```powershell
# 1. Run setup script
.\setup.ps1

# 2. Start the application
docker-compose up -d

# 3. Open in browser
# http://localhost:5000
```

## Quick Start (Linux/Mac)

```bash
# 1. Make setup script executable
chmod +x setup.sh

# 2. Run setup script
./setup.sh

# 3. Start the application
docker-compose up -d

# 4. Open in browser
# http://localhost:5000
```

---

## Manual Setup (Step by Step)

### Step 1: Configure Environment

```bash
# Copy template
cp .env.production .env

# Edit .env file
nano .env  # or use your favorite editor
```

**Required Environment Variables:**

```env
# Generate with: openssl rand -hex 32
SESSION_SECRET=your_random_64_char_hex_string

# Get from: https://developers.facebook.com/apps
INSTAGRAM_APP_ID=4224943747791118
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token

# Your public URL
OAUTH_BASE_URL=https://yourdomain.com

# Database (auto-configured by Docker Compose)
POSTGRES_PASSWORD=your_secure_password

# Enable auto webhook subscription
AUTO_SUBSCRIBE_WEBHOOKS=true
WEBHOOK_FIELDS=comments,messages,mentions,story_insights
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Docker Services

```bash
# Start PostgreSQL only
docker-compose up -d postgres

# Wait for database to be ready (automatic health check)
docker-compose ps
```

### Step 4: Run Database Migrations

``bash
npm run db:push
```

### Step 5: Start the Application

**Option A: Development Mode (Outside Docker)**
```bash
npm run dev
```

**Option B: Production Mode (Full Docker Stack)**
```bash
docker-compose up -d
```

**Option C: With Database UI (Adminer)**
```bash
docker-compose --profile debug up -d
# Access Adminer at http://localhost:8080
```

---

## Docker Compose Services

### Main Services

1. **postgres** - PostgreSQL 16 database
   - Port: 5432
   - Auto health checks
   - Persistent data volume

2. **app** - Instagram Automation Platform
   - Port: 5000
   - Auto-migration on startup
   - Depends on PostgreSQL health

### Debug Services (Optional)

3. **adminer** - Database management UI
   - Port: 8080
   - Only starts with `--profile debug`

---

## New Features Added

### 1. Automatic Webhook Subscription ✨

When you connect an Instagram account via OAuth, the system **automatically subscribes** to webhooks if `AUTO_SUBSCRIBE_WEBHOOKS=true`.

**How it works:**
```
User connects Instagram account
  ↓
OAuth callback receives access token
  ↓
Account saved to database
  ↓
System automatically calls Instagram Graph API
  ↓
Subscribes account to: comments, messages, mentions, story_insights
  ↓
Webhooks start flowing immediately
```

### 2. Webhook Management Endpoints

#### Subscribe Manually
```bash
POST /api/accounts/{accountId}/subscribe-webhooks
Authorization: Bearer your-session

# Body (optional):
{
  "fields": ["comments", "messages", "mentions", "story_insights"]
}
```

#### Check Subscriptions
```bash
GET /api/accounts/{accountId}/webhook-subscriptions
Authorization: Bearer your-session
```

#### Unsubscribe
```bash
POST /api/accounts/{accountId}/unsubscribe-webhooks
Authorization: Bearer your-session
```

### 3. Diagnostic Endpoints

#### Health Check (Public)
```bash
GET /api/health

# Returns:
{
  "status": "healthy",
  "database": "connected",
  "accounts": 2,
  "activeAccounts": 2,
  "flows": 5,
  "activeFlows": 3,
  "environment": "production"
}
```

#### Full Diagnostic (Authenticated)
```bash
GET /api/diagnostic
Authorization: Bearer your-session

# Returns:
{
  "webhookConfig": {...},
  "accounts": [...],
  "flows": {...},
  "executions": {...},
  "webhookEvents": {...}
}
```

### 4. Manual Flow Trigger (For Testing)

Test flows without real Instagram webhooks:

```bash
POST /api/flows/{flowId}/trigger
Authorization: Bearer your-session

# Body:
{
  "webhookPayload": {
    "comment_text": "Test comment",
    "from_username": "testuser"
  }
}

# OR for DMs:
{
  "webhookPayload": {
    "message_text": "Test message",
    "sender_id": "123456789"
  }
}
```

---

## Environment Variables Reference

### Database
```env
POSTGRES_USER=postgres           # Default: postgres
POSTGRES_PASSWORD=postgres       # CHANGE THIS!
POSTGRES_DB=instagram_automation
POSTGRES_PORT=5432
```

### Instagram/Facebook
```env
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_token
FACEBOOK_APP_ID=your_facebook_app_id  # Optional
FACEBOOK_APP_SECRET=your_facebook_secret  # Optional
```

### OAuth
```env
OAUTH_BASE_URL=https://yourdomain.com
```

### Webhook Auto-Subscription
```env
AUTO_SUBSCRIBE_WEBHOOKS=true
WEBHOOK_FIELDS=comments,messages,mentions,story_insights
```

### Optional: AI Agents
```env
GEMINI_API_KEY=your_gemini_api_key
```

### Server
```env
PORT=5000
NODE_ENV=production
```

---

## Docker Commands

### Start Services
```bash
# All services
docker-compose up -d

# Specific service
docker-compose up -d postgres

# With build
docker-compose up -d --build
```

### Stop Services
```bash
# Stop all
docker-compose down

# Stop and remove volumes (DELETES DATABASE!)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
```

### Execute Commands
```bash
# Access app container
docker-compose exec app sh

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d instagram_automation

# Run migration manually
docker-compose exec app npm run db:push
```

### Health Checks
```bash
# Check service status
docker-compose ps

# Check app health
curl http://localhost:5000/api/health
```

---

## Deployment Options

### Option 1: Docker Compose (This Setup)
- ✅ Easiest local development
- ✅ Easiest self-hosting
- ✅ Full control

```bash
docker-compose up -d
```

### Option 2: Easypanel
- ✅ Web UI for deployment
- ✅ Automatic HTTPS
- ✅ Easy scaling

See `EASYPANEL.md` for details.

### Option 3: VPS/Cloud
- ✅ Maximum flexibility
- ✅ Any cloud provider

See `INSTALLATION_GUIDE.md` for details.

### Option 4: Replit
- ✅ One-click deploy
- ✅ No infrastructure needed

Click "Publish" button in Replit.

---

## Troubleshooting

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### App Not Starting

```bash
# View app logs
docker-compose logs app

# Check if database is ready
docker-compose exec postgres pg_isready

# Restart app
docker-compose restart app
```

### Migrations Failed

```bash
# Run migrations manually
docker-compose exec app npm run db:push

# Or rebuild everything
docker-compose down -v
docker-compose up -d
```

### Webhook Subscription Failed

```bash
# Check diagnostic endpoint
curl http://localhost:5000/api/diagnostic

# Try manual subscription via UI or API
POST /api/accounts/{accountId}/subscribe-webhooks
```

---

## Production Checklist

Before deploying to production:

- [ ] Generate secure `SESSION_SECRET` (64 characters)
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Configure `OAUTH_BASE_URL` with your domain
- [ ] Set up HTTPS (use reverse proxy like Nginx or Caddy)
- [ ] Enable `AUTO_SUBSCRIBE_WEBHOOKS=true`
- [ ] Configure  webhooks in Meta for Developers
- [ ] Test health endpoint: `/api/health`
- [ ] Test diagnostic endpoint: `/api/diagnostic`
- [ ] Set up backup strategy for PostgreSQL volume
- [ ] Monitor logs: `docker-compose logs -f`
- [ ] Set up firewall rules (allow 5000, block 5432 from public)

---

## Backup & Restore

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres instagram_automation > backup.sql

# Or with Docker volume
docker run --rm -v instaflowsreplit_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

### Restore Database
```bash
# From SQL dump
cat backup.sql | docker-compose exec -T postgres psql -U postgres instagram_automation

# From volume backup
docker run --rm -v instaflowsreplit_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

---

## Monitoring

### Health Check Endpoint
```bash
# Quick health check
curl http://localhost:5000/api/health

# Pretty JSON (with jq)
curl http://localhost:5000/api/health | jq
```

### Diagnostic Dashboard
```bash
# Full diagnostic (requires authentication)
curl -H "Cookie: connect.sid=your-session" \
  http://localhost:5000/api/diagnostic | jq
```

### Database Monitoring
```bash
# Connect to Adminer
docker-compose --profile debug up -d adminer
# Open: http://localhost:8080
# Server: postgres
# Username: postgres
# Password: (from .env)
# Database: instagram_automation
```

---

## Support

For issues or questions:

1. Check `TROUBLESHOOTING_GUIDE.md`
2. Check `FLOW_EXECUTION_MAP.md` for flow logic
3. View logs: `docker-compose logs -f`
4. Open GitHub issue

---

## Summary of What Was Done

1. **Complete Docker Compose Setup**
   - PostgreSQL with health checks
   - App container with auto-migration
   - Optional Adminer for database management

2. **Automatic Webhook Subscription**
   - Added to OAuth callback
   - Configurable via environment variables
   - Manual subscription endpoints

3. **Diagnostic & Testing Tools**
   - Health check endpoint
   - Full diagnostic dashboard
   - Manual webhook subscription
   - Manual flow trigger for testing

4. **Setup Scripts**
   - `setup.ps1` for Windows
   - `setup.sh` for Linux/Mac
   - Automated environment validation
   - One-command setup

5. **Enhanced Documentation**
   - This deployment guide
   - Troubleshooting guide
   - Flow execution map
   - Environment templates

**Result:** Complete, production-ready Instagram automation platform with one-command deployment! 🎉
