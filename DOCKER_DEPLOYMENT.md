# Docker & Easypanel Deployment Guide

## Table of Contents
1. [Quick Start with Docker Compose](#quick-start-with-docker-compose)
2. [Easypanel One-Click Install](#easypanel-one-click-install)
3. [Manual Docker Deployment](#manual-docker-deployment)
4. [Database Migrations](#database-migrations)
5. [Backup & Restore](#backup--restore)

---

## Quick Start with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- **Node.js 20.11.0+ (if building locally)**
- Meta App credentials (Instagram App ID & Secret)

**Note:** The Docker image is pre-configured with Node.js 20.11+. If you see `ERR_INVALID_ARG_TYPE` errors, see [NODE_VERSION_FIX.md](NODE_VERSION_FIX.md).

### Step 1: Clone and Configure

```bash
# Clone repository
git clone <your-repo-url>
cd instagram-automation

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Step 2: Configure Environment

Edit `.env` file:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/instaflow

# Instagram OAuth
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret

# Session Secret (generate random string)
SESSION_SECRET=$(openssl rand -hex 32)

# Your domain
OAUTH_BASE_URL=https://your-domain.com
```

### Step 3: Deploy

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Check health
docker-compose ps
```

### Step 4: Access Application

- App: http://localhost:5000
- Database: localhost:5432

### Management Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v

# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart app

# Execute commands in container
docker-compose exec app sh

# Manual migration
docker-compose exec app npm run db:push
```

---

## Easypanel One-Click Install

### Method 1: From Template JSON

1. **Login to Easypanel Dashboard**

2. **Create New Project**
   - Click "Create Project"
   - Name: `instaflow` (or your choice)

3. **Add from Template**
   - Click "Create from JSON"
   - Copy contents of `easypanel-template.json`
   - Paste and click "Create"

4. **Configure Environment Variables**
   - Go to App → Environment
   - Set required variables:
     ```
     INSTAGRAM_APP_ID=your_app_id
     INSTAGRAM_APP_SECRET=your_app_secret
     FACEBOOK_APP_ID=your_facebook_id (optional)
     FACEBOOK_APP_SECRET=your_facebook_secret (optional)
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Access via your assigned domain

### Method 2: Using Pre-built Docker Image

1. **Create Services Manually**

   **PostgreSQL Service:**
   ```
   Type: Database → PostgreSQL
   Name: postgres
   Version: 16
   ```

   **Application Service:**
   ```
   Type: App
   Name: app
   Image: yourdockerhub/instaflow:latest
   Port: 5000
   ```

2. **Configure App Environment:**
   ```
   DATABASE_URL = $$ref(postgres.DATABASE_URL)
   SESSION_SECRET = $$secret(32)
   INSTAGRAM_APP_ID = your_app_id
   INSTAGRAM_APP_SECRET = your_app_secret
   OAUTH_BASE_URL = https://$(PRIMARY_DOMAIN)
   NODE_ENV = production
   ```

3. **Setup Domain**
   - Add domain pointing to port 5000
   - Enable HTTPS (automatic)

4. **Deploy**

### Method 3: Build from GitHub

1. **Create App Service**
   ```
   Source: GitHub Repository
   Repository: https://github.com/yourusername/instagram-automation
   Branch: main
   Build Type: Dockerfile
   ```

2. **Build Settings**
   - Dockerfile path: `./Dockerfile`
   - Build context: `.`

3. **Configure Environment** (same as Method 2)

4. **Deploy & Build**

---

## Manual Docker Deployment

### Build Image

```bash
# Build image
docker build -t instaflow:latest .

# Tag for registry
docker tag instaflow:latest yourdockerhub/instaflow:latest

# Push to registry
docker push yourdockerhub/instaflow:latest
```

### Run Manually

```bash
# Create network
docker network create instaflow_network

# Run PostgreSQL
docker run -d \
  --name instaflow_db \
  --network instaflow_network \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=instaflow \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Run Application
docker run -d \
  --name instaflow_app \
  --network instaflow_network \
  -p 5000:5000 \
  -e DATABASE_URL=postgresql://postgres:postgres@instaflow_db:5432/instaflow \
  -e SESSION_SECRET=your_secret \
  -e INSTAGRAM_APP_ID=your_app_id \
  -e INSTAGRAM_APP_SECRET=your_app_secret \
  -e OAUTH_BASE_URL=https://your-domain.com \
  instaflow:latest
```

---

## Database Migrations

### Automatic Migrations

The Docker container automatically runs migrations on startup via `docker-entrypoint.sh`:

1. Waits for database to be ready (using `pg_isready`)
2. Runs `npm run db:push`
3. On failure, checks `FORCE_MIGRATIONS` env variable:
   - If `FORCE_MIGRATIONS=true`: Runs `npm run db:push --force` (⚠️ may cause data loss)
   - If `FORCE_MIGRATIONS=false`: Exits with error (safe default)
4. Starts application
5. Template seeding happens automatically in the app (see `server/index.ts`)

### Manual Migration

```bash
# Using Docker Compose
docker-compose exec app npm run db:push

# Force migration (⚠️ WARNING: may cause data loss)
docker-compose exec app npm run db:push -- --force

# Using standalone Docker
docker exec -it instaflow_app npm run db:push

# Automatic force migration on startup (add to .env)
FORCE_MIGRATIONS=true  # ⚠️ Use with caution
```

### Migration Troubleshooting

**Problem: Migration fails on startup**

```bash
# Check logs
docker-compose logs app

# Manual intervention
docker-compose exec app sh
npm run db:push -- --force
exit
```

**Problem: Database schema out of sync**

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d instaflow

# Check tables
\dt

# Exit
\q

# Force sync
docker-compose exec app npm run db:push -- --force
```

### Schema Management

The application uses Drizzle ORM:

- Schema: `shared/schema.ts`
- Config: `drizzle.config.ts`
- Migrations: Auto-generated via `db:push`

**Important**: Never manually write SQL migrations. Always use `npm run db:push`.

---

## Backup & Restore

### Automatic Backups

The `docker-compose.yml` includes automatic backup service:

```yaml
backup:
  image: prodrigestivill/postgres-backup-local
  environment:
    SCHEDULE: "@daily"
    BACKUP_KEEP_DAYS: 7
    BACKUP_KEEP_WEEKS: 4
    BACKUP_KEEP_MONTHS: 6
```

Backups are stored in `./backups` directory.

### Manual Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres instaflow > backup_$(date +%Y%m%d).sql

# Or using pg_dumpall
docker-compose exec postgres pg_dumpall -U postgres > backup_all_$(date +%Y%m%d).sql

# Compressed backup
docker-compose exec postgres pg_dump -U postgres -F c instaflow > backup_$(date +%Y%m%d).pgdump
```

### Restore Backup

```bash
# Stop application
docker-compose stop app

# Restore SQL backup
cat backup_20240101.sql | docker-compose exec -T postgres psql -U postgres instaflow

# Or restore compressed backup
docker-compose exec postgres pg_restore -U postgres -d instaflow -v /backups/backup_20240101.pgdump

# Restart application
docker-compose start app
```

### Easypanel Backups

**Using Easypanel's Built-in Backup:**

1. Go to Database Service → Backups
2. Configure S3 storage (AWS, DigitalOcean Spaces, etc.)
3. Set schedule (hourly, daily, weekly)
4. Enable encryption (optional)

**Manual Easypanel Backup:**

1. Access database service
2. Open terminal/console
3. Run:
   ```bash
   pg_dump -U postgres instaflow > /backup/manual_$(date +%Y%m%d).sql
   ```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `INSTAGRAM_APP_ID` | Meta App ID | `123456789012345` |
| `INSTAGRAM_APP_SECRET` | Meta App Secret | `abc123def456...` |
| `SESSION_SECRET` | Express session secret | Random 32+ char string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OAUTH_BASE_URL` | Your app's public URL | Auto-detected |
| `FACEBOOK_APP_ID` | Facebook App ID | Not set |
| `FACEBOOK_APP_SECRET` | Facebook App Secret | Not set |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Application port | `5000` |
| `FORCE_MIGRATIONS` | Force migrations on startup | `false` |

---

## Healthchecks

### Container Health

```bash
# Check container health
docker-compose ps

# Application health endpoint
curl http://localhost:5000/api/health

# Database health
docker-compose exec postgres pg_isready
```

### Application Logs

```bash
# View all logs
docker-compose logs -f

# App only
docker-compose logs -f app

# Database only
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 app
```

---

## Troubleshooting

### Common Issues

**1. Application won't start**
```bash
# Check logs
docker-compose logs app

# Verify environment
docker-compose exec app env | grep DATABASE

# Test database connection
docker-compose exec app sh -c 'pg_isready -d "$DATABASE_URL"'

# Or test via health endpoint
curl http://localhost:5000/api/health
```

**2. Migration fails**
```bash
# Force push schema
docker-compose exec app npm run db:push -- --force

# Check database connectivity
docker-compose exec postgres psql -U postgres -d instaflow -c "SELECT 1;"
```

**3. Can't connect to database**
```bash
# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres

# Verify network
docker network inspect instaflow_network
```

**4. Port already in use**
```bash
# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Use 5001 instead

# Or find and kill process
lsof -ti:5000 | xargs kill
```

---

## Production Checklist

- [ ] Use strong `POSTGRES_PASSWORD`
- [ ] Generate secure `SESSION_SECRET` (32+ chars)
- [ ] Configure `OAUTH_BASE_URL` to your domain
- [ ] Enable HTTPS/SSL
- [ ] Set up automatic backups
- [ ] Configure health checks
- [ ] Enable logging/monitoring
- [ ] Set resource limits (CPU/Memory)
- [ ] Configure Meta App OAuth redirect URIs
- [ ] Set up Instagram webhooks in Meta Dashboard
- [ ] Test OAuth flow end-to-end
- [ ] Test webhook delivery
- [ ] Configure firewall rules
- [ ] Set up domain and SSL certificate

---

## Support

- **Documentation**: Check README.md and other guides
- **Issues**: GitHub Issues
- **Docker Hub**: [Your Docker Hub](https://hub.docker.com/r/yourusername/instaflow)
- **Easypanel**: https://easypanel.io/docs

---

**Last Updated**: 2024
**Docker Version**: 20+
**Easypanel Version**: Latest
