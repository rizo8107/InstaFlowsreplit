# Installation Guide

Complete installation and deployment guide for Instagram Automation Platform.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
  - [Replit (Recommended)](#option-1-replit-recommended---easiest)
  - [Easypanel (Docker)](#option-2-easypanel-docker)
  - [VPS/Cloud Server](#option-3-vpscloud-server)
- [Environment Configuration](#environment-configuration)
- [Post-Deployment Setup](#post-deployment-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before installing, ensure you have:

- **Instagram Business Account** connected to a Facebook Page
- **Meta for Developers App** with Instagram permissions
- **Node.js 20+** (for local development)
- **PostgreSQL 16+** (or use Docker)
- **Domain with SSL** (for webhooks to work)

---

## Quick Start

### Local Development

```bash
# Clone repository
git clone <your-repo-url>
cd instagram-automation-platform

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Run database migration
npm run db:push

# Start development server
npm run dev
```

Access at: `http://localhost:5000`

---

## Deployment Options

### Option 1: Replit (Recommended - Easiest)

**✅ Best for:** Quick deployment, no DevOps experience needed

**Steps:**
1. Fork/Import project to Replit
2. Click **Publish** button
3. App goes live at `https://your-app.replit.app`
4. All features work automatically (database, webhooks, SSL)

**Advantages:**
- One-click deployment
- Automatic SSL/HTTPS
- Built-in database
- Auto-restart on code changes
- Free tier available

**Configure Instagram Webhooks:**
- Webhook URL: `https://your-app.replit.app/api/webhooks/instagram`
- Verify Token: `zenthra`

---

### Option 2: Easypanel (Docker)

**✅ Best for:** Self-hosting, VPS deployment, production use

#### Method A: Docker Compose (Quickest)

```bash
# Clone repository
git clone <your-repo-url>
cd instagram-automation-platform

# Configure environment
cp .env.example .env
nano .env  # Add your credentials

# Deploy with Docker
docker-compose up -d

# Check status
docker-compose logs -f
```

Access at: `http://localhost:5000`

#### Method B: Easypanel UI

1. **Login to Easypanel Dashboard**
   - Go to your Easypanel instance
   - Click "Create" → "Project"

2. **Import Docker Compose**
   - Choose "Docker Compose" template
   - Paste contents from `docker-compose.yml`

3. **Configure Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/instagram_automation
   SESSION_SECRET=<generate-random-string>
   INSTAGRAM_APP_ID=<your-meta-app-id>
   INSTAGRAM_APP_SECRET=<your-meta-app-secret>
   INSTAGRAM_WEBHOOK_VERIFY_TOKEN=zenthra
   ```

4. **Set Secrets** (in Easypanel secrets section)
   ```
   SESSION_SECRET=<run: openssl rand -hex 32>
   INSTAGRAM_APP_ID=<from Meta for Developers>
   INSTAGRAM_APP_SECRET=<from Meta for Developers>
   POSTGRES_PASSWORD=<strong-password>
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build completion
   - App runs on port 5000

6. **Configure Domain**
   - Add your domain in "Domains" tab
   - Point DNS A record to your server IP
   - Enable SSL/TLS (automatic with Let's Encrypt)

#### Method C: From Git Repository

1. **Connect Repository**
   - In Easypanel: Create new app
   - Choose "GitHub" or "GitLab"
   - Select your repository

2. **Build Configuration**
   - Build Type: `Dockerfile`
   - Dockerfile Path: `./Dockerfile`
   - Port: `5000`

3. **Add PostgreSQL Service**
   - Create new service → PostgreSQL 16
   - Database: `instagram_automation`
   - Note connection string

4. **Deploy**
   - Click "Deploy"
   - Monitor logs
   - Verify app is running

---

### Option 3: VPS/Cloud Server

**✅ Best for:** Custom infrastructure, maximum control

#### On Ubuntu/Debian:

**1. Install Dependencies**
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 16
sudo apt-get install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2
```

**2. Setup PostgreSQL**
```bash
sudo -u postgres psql

# In PostgreSQL console:
CREATE DATABASE instagram_automation;
CREATE USER appuser WITH PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE instagram_automation TO appuser;
\q
```

**3. Clone & Setup Application**
```bash
# Clone repository
git clone <your-repo-url>
cd instagram-automation-platform

# Install dependencies
npm install

# Build application
npm run build
```

**4. Configure Environment**
```bash
cp .env.example .env
nano .env
```

Add:
```env
DATABASE_URL=postgresql://appuser:your-password@localhost:5432/instagram_automation
SESSION_SECRET=<run: openssl rand -hex 32>
INSTAGRAM_APP_ID=<your-app-id>
INSTAGRAM_APP_SECRET=<your-app-secret>
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=zenthra
NODE_ENV=production
PORT=5000
```

**5. Run Database Migration**
```bash
npm run db:push
```

**6. Start with PM2**
```bash
# Start application
pm2 start npm --name "instagram-automation" -- start

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
# Run the command it outputs
```

**7. Setup Nginx Reverse Proxy**
```bash
# Install Nginx
sudo apt-get install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/instagram-automation
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/instagram-automation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**8. Setup SSL with Let's Encrypt**
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

**9. Verify Installation**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs instagram-automation

# Check Nginx
sudo systemctl status nginx

# Test app
curl https://your-domain.com/api/accounts
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | How to Get | Example |
|----------|-------------|------------|---------|
| `DATABASE_URL` | PostgreSQL connection | Docker/local setup | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Session encryption key | `openssl rand -hex 32` | `a1b2c3d4e5f6...` (64 chars) |
| `INSTAGRAM_APP_ID` | Meta App ID | [Meta for Developers](https://developers.facebook.com) | `123456789012345` |
| `INSTAGRAM_APP_SECRET` | Meta App Secret | Meta for Developers | `abc123def456...` |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Webhook verification | Choose any string | `zenthra` (default) |
| `PORT` | Server port | Optional | `5000` (default) |
| `NODE_ENV` | Environment | Set for production | `production` |

### Generate Session Secret
```bash
openssl rand -hex 32
```

### Get Instagram App Credentials

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create New App → Business → Instagram
3. App Dashboard → Settings → Basic
4. Copy App ID and App Secret
5. Add Instagram Product
6. Request permissions: `instagram_business_manage_messages`, `instagram_business_manage_comments`

---

## Post-Deployment Setup

### 1. Configure Meta Webhooks

**Navigate to:** Meta for Developers → Your App → Products → Webhooks

**Webhook Configuration:**
- **Callback URL:** `https://your-domain.com/api/webhooks/instagram`
- **Verify Token:** `zenthra` (or your custom token)
- **Subscription Fields:** Select all:
  - ✅ comments
  - ✅ messages  
  - ✅ mentions
  - ✅ story_insights

**Privacy & Terms URLs:**
- **Privacy Policy:** `https://your-domain.com/privacy`
- **Terms of Service:** `https://your-domain.com/terms`

### 2. Test Webhook Connection

```bash
# Method 1: Meta will test automatically when you subscribe

# Method 2: Manual test
curl -X GET "https://your-domain.com/api/webhooks/instagram?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=zenthra"

# Should return: test123
```

### 3. Connect Instagram Account

1. Login to your deployed app
2. Navigate to **Accounts** page
3. Click "Add Account"
4. Enter:
   - Instagram User ID (from Graph API)
   - Access Token (with required permissions)
   - Account username

**Get Access Token:**
```bash
# Using Graph API Explorer
https://developers.facebook.com/tools/explorer/

# Or generate programmatically
# See: https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions
```

### 4. Create Your First Flow

1. Go to **Flows** page
2. Click "Create New Flow" or use a template
3. Configure:
   - Trigger (Comment/DM/Mention)
   - Conditions (optional filters)
   - Actions (Reply/DM/Like/etc)
4. Toggle "Active"
5. Test by commenting on your Instagram post

---

## Troubleshooting

### Common Issues

#### 1. Webhooks Not Receiving Events

**Symptoms:** Instagram events not triggering flows

**Solutions:**
```bash
# Check webhook URL is accessible
curl https://your-domain.com/api/webhooks/instagram

# Verify SSL certificate
curl -I https://your-domain.com

# Check Meta webhook configuration
# Ensure verify token matches

# Review server logs
pm2 logs instagram-automation  # PM2
docker-compose logs -f app     # Docker
```

#### 2. Database Connection Failed

**Symptoms:** "Connection refused" or "Authentication failed"

**Solutions:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # VPS
docker ps | grep postgres         # Docker

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Verify DATABASE_URL format
# Should be: postgresql://user:pass@host:port/db

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

#### 3. Instagram API Errors

**Symptoms:** "Invalid access token" or API errors in logs

**Solutions:**
- Verify access token hasn't expired
- Check Instagram account is Business account
- Ensure all permissions are granted:
  - `instagram_business_manage_messages`
  - `instagram_business_manage_comments`
- Regenerate access token if needed

#### 4. Build Failures

**Symptoms:** Docker build fails or npm install errors

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Docker: Clear build cache
docker-compose down
docker system prune -a
docker-compose up -d --build
```

#### 5. Port Already in Use

**Symptoms:** "EADDRINUSE: address already in use :::5000"

**Solutions:**
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Or change port in .env
PORT=3000
```

### Debug Mode

Enable detailed logging:

```bash
# Add to .env
DEBUG=*
LOG_LEVEL=debug

# Restart application
pm2 restart instagram-automation  # PM2
docker-compose restart app        # Docker
```

### Health Checks

```bash
# API health
curl https://your-domain.com/api/accounts

# Database health
curl https://your-domain.com/api/flows

# Webhook endpoint
curl https://your-domain.com/api/webhooks/instagram
```

---

## Maintenance

### Updates

**PM2 (VPS):**
```bash
cd instagram-automation-platform
git pull
npm install
npm run build
npm run db:push
pm2 restart instagram-automation
```

**Docker:**
```bash
cd instagram-automation-platform
git pull
docker-compose down
docker-compose up -d --build
```

**Easypanel:**
- Enable auto-deploy from Git
- Or click "Rebuild" in dashboard

### Backups

**Database Backup:**
```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup-20241013.sql
```

**Docker Backup:**
```bash
docker exec postgres pg_dump -U postgres instagram_automation > backup.sql
```

### Monitoring

**PM2 Monitoring:**
```bash
pm2 monit
pm2 logs instagram-automation --lines 100
```

**Docker Monitoring:**
```bash
docker-compose logs -f --tail=100
docker stats
```

---

## Security Best Practices

- [ ] Use strong `SESSION_SECRET` (32+ characters)
- [ ] Enable HTTPS/SSL for all traffic
- [ ] Secure database with strong password
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Enable firewall (UFW on Ubuntu)
- [ ] Use environment variables for secrets
- [ ] Regular database backups
- [ ] Monitor access logs
- [ ] Rate limit API endpoints
- [ ] Keep Node.js and PostgreSQL updated

---

## Performance Optimization

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_flows_account ON flows(account_id, is_active);
CREATE INDEX idx_executions_flow ON executions(flow_id, created_at);
CREATE INDEX idx_webhooks_processed ON webhook_events(processed, created_at);

-- Vacuum database regularly
VACUUM ANALYZE;
```

### Caching
- Consider Redis for session storage
- Cache Instagram API responses
- Use CDN for static assets

### Scaling
- Increase PM2 instances: `pm2 scale instagram-automation 4`
- Add load balancer (Nginx)
- Use managed database (AWS RDS, Neon)
- Horizontal scaling with Docker Swarm/Kubernetes

---

## Support & Resources

- **Documentation:** [README.md](./README.md)
- **Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Easypanel Guide:** [EASYPANEL.md](./EASYPANEL.md)
- **Instagram API:** [Meta for Developers](https://developers.facebook.com/docs/instagram-api)
- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)

---

## License

MIT License - See [LICENSE](./LICENSE) file for details

---

**Built with ❤️ using Replit**
