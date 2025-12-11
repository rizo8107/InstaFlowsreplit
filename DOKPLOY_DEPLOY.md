# 🚀 Dokploy Deployment Guide

## Quick Deploy to Dokploy

This guide will help you deploy the Instagram Automation Platform to Dokploy with a single command.

---

## Prerequisites

1. **Dokploy instance** running and accessible
2. **Git repository** with your code pushed
3. **Instagram App** created in Meta for Developers
4. **Domain name** (optional, for production)

---

## Step 1: Push to Git

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "feat: Instagram automation platform with auto webhook subscription"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/instagram-automation.git

# Push
git push -u origin main
```

---

## Step 2: Deploy to Dokploy

### Option A: Via Dokploy UI

1. **Login to Dokploy dashboard**

2. **Create New Application:**
   - Click "New Application"
   - Name: `instagram-automation`
   - Source Type: **Git**
   - Repository URL: `https://github.com/yourusername/instagram-automation.git`
   - Branch: `main`
   - Build Type: **Docker Compose**

3. **Configure Environment Variables:**

   Click "Environment" and add these variables:

   ```env
   # Required
   SESSION_SECRET=your_random_64_char_hex_string
   INSTAGRAM_APP_ID=4224943747791118
   INSTAGRAM_APP_SECRET=your_instagram_app_secret
   INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token
   OAUTH_BASE_URL=https://yourdomain.com
   
   # Optional: Facebook
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   
   # Optional: AI Agents
   GEMINI_API_KEY=your_gemini_api_key
   
   # Database (auto-configured)
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_database_password
   POSTGRES_DB=instagram_automation
   
   # Webhook Auto-Subscription (default: true)
   AUTO_SUBSCRIBE_WEBHOOKS=true
   WEBHOOK_FIELDS=comments,messages,mentions,story_insights
   
   # Server
   PORT=5000
   NODE_ENV=production
   ```

4. **Configure Domain (Optional):**
   - Go to "Domains" tab
   - Add your domain: `instagram.yourdomain.com`
   - Enable SSL (Let's Encrypt)

5. **Deploy:**
   - Click "Deploy" button
   - Wait for build to complete (3-5 minutes)
   - Application will be live at your domain or Dokploy URL

### Option B: Via Dokploy CLI (Coming Soon)

```bash
# Install Dokploy CLI
npm install -g dokploy-cli

# Login
dokploy login

# Deploy
dokploy deploy --file docker-compose.yml --env .env.production
```

---

## Step 3: Verify Deployment

### 1. Check Application Health

```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

### 2. Check Logs

In Dokploy dashboard:
- Go to your application
- Click "Logs" tab
- Watch for:
  ```
  11:56:06 AM [express] serving on http://0.0.0.0:5000
  ```

### 3. Test Auto Webhook Subscription

1. Open your deployed app
2. Login/Register
3. Connect Instagram account
4. Check logs for:
   ```
   [OAuth] ✅ Successfully subscribed to webhooks
   ```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | Session encryption key (64 chars) | Generate with `openssl rand -hex 32` |
| `INSTAGRAM_APP_ID` | Instagram App ID from Meta | `4224943747791118` |
| `INSTAGRAM_APP_SECRET` | Instagram App Secret | From Meta dashboard |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Custom token for webhook verification | Any random string |
| `OAUTH_BASE_URL` | Your public domain URL | `https://yourdomain.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API for AI agents | (none) |
| `FACEBOOK_APP_ID` | Facebook App ID | (none) |
| `FACEBOOK_APP_SECRET` | Facebook App Secret | (none) |
| `AUTO_SUBSCRIBE_WEBHOOKS` | Enable auto webhook subscription | `true` |
| `WEBHOOK_FIELDS` | Comma-separated webhook fields | `comments,messages,mentions,story_insights` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `PORT` | Application port | `5000` |

---

## Docker Compose Configuration

Your `docker-compose.yml` is already configured for Dokploy with:

- ✅ PostgreSQL 16 database with persistent storage
- ✅ Application with auto-migration on startup
- ✅ Health checks for dependencies
- ✅ Auto webhook subscription enabled
- ✅ Production-optimized settings
- ✅ Optional Adminer for database management

The compose file uses environment variable substitution, so Dokploy will automatically inject your configured environment variables.

---

## Updating Your Deployment

### Method 1: Git Push (Automatic)

```bash
# Make changes to your code
git add .
git commit -m "Update: description of changes"
git push

# Dokploy will auto-deploy (if webhook configured)
```

### Method 2: Manual Redeploy

In Dokploy dashboard:
1. Go to your application
2. Click "Redeploy" button
3. Wait for deployment to complete

---

## Configure Instagram Webhooks in Meta

**Important:** Even with auto-subscription enabled, you need to configure the webhook endpoint in Meta for Developers:

1. Go to https://developers.facebook.com/apps/YOUR_APP_ID
2. Navigate to **Products** → **Webhooks**
3. Select **Instagram**
4. Click **Configure** next to Instagram
5. Add Callback URL: `https://yourdomain.com/api/webhooks/instagram`
6. Add Verify Token: (same as `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`)
7. Click **Verify and Save**

The app will handle the verification automatically!

---

## Troubleshooting

### Application Won't Start

Check logs in Dokploy:
```
- Container instaflows-app  Error
```

**Common causes:**
- Missing required environment variables
- Database not starting (check PostgreSQL logs)
- Build failed (check build logs)

**Solution:**
1. Verify all required env vars are set
2. Check PostgreSQL password is correct
3. Redeploy application

### Database Connection Failed

**Error:** `ECONNREFUSED postgres:5432`

**Solution:**
- Dokploy automatically creates a network for your compose services
- Ensure `DATABASE_URL` uses `postgres` as hostname (not `localhost`)
- Check PostgreSQL container is running

### Webhooks Not Working

**Common issues:**
1. **Auto-subscription failed:**
   - Check logs for webhook subscription errors
   - Manually subscribe via API: `POST /api/accounts/:id/subscribe-webhooks`

2. **Webhook verification failed:**
   - Ensure `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` matches in both app and Meta dashboard
   - Check callback URL is correct and publicly accessible

3. **Instagram account inactive:**
   - Verify account in database: check `is_active` column
   - Reconnect Instagram account if needed

---

## Database Backups

### Manual Backup

In Dokploy dashboard:
1. Go to your application
2. Find PostgreSQL service
3. Click "Backup" button

Or via command:
```bash
docker exec instaflows-db pg_dump -U postgres instagram_automation > backup.sql
```

### Restore from Backup

```bash
docker exec -i instaflows-db psql -U postgres instagram_automation < backup.sql
```

---

## Scaling

Dokploy supports horizontal scaling:

1. Go to your application
2. Click "Scale" tab
3. Add more instances
4. Configure load balancer

**Note:** Each instance connects to the same PostgreSQL database, so state is shared.

---

## Monitoring

### Application Metrics

- **Health Endpoint:** `GET /api/health`
- **Diagnostic Dashboard:** `GET /api/diagnostic` (requires auth)

### Dokploy Metrics

In dashboard:
- CPU usage
- Memory usage
- Network traffic
- Container logs

### Set Up Alerts (Optional)

Configure alerts in Dokploy for:
- Application down
- High memory usage
- Database connection failures

---

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] `SESSION_SECRET` is a secure random string
- [ ] `POSTGRES_PASSWORD` is strong and unique
- [ ] `OAUTH_BASE_URL` points to your domain
- [ ] Domain configured with SSL
- [ ] Instagram webhooks configured in Meta dashboard
- [ ] Test account connection and webhook flow
- [ ] Database backups configured
- [ ] Monitoring/alerts set up

---

## Quick Deploy Commands

```bash
# 1. Prepare for deployment
git add .
git commit -m "feat: Ready for Dokploy deployment"
git push origin main

# 2. Generate secure secrets
echo "SESSION_SECRET=$(openssl rand -hex 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)"

# 3. Deploy via Dokploy UI (see steps above)

# 4. Verify deployment
curl https://yourdomain.com/api/health

# 5. Monitor logs
# (via Dokploy dashboard)
```

---

## Support

- **Documentation:** Check `DEPLOY.md`, `TROUBLESHOOTING_GUIDE.md`
- **Logs:** Dokploy dashboard → Your app → Logs
- **Health Check:** `https://yourdomain.com/api/health`

---

## Summary

Your Instagram automation platform is ready for Dokploy deployment with:

- ✅ Complete Docker Compose configuration
- ✅ Automatic database migrations
- ✅ Auto webhook subscription
- ✅ Health monitoring
- ✅ Production-ready Dockerfile
- ✅ Environment variable configuration

**Just push to Git and deploy via Dokploy UI! 🚀**
