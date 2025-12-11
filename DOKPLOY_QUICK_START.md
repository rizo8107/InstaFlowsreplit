# 🎯 Quick Deploy to Dokploy - Single Command

## TL;DR - Super Quick Deploy

```powershell
# Windows (PowerShell)
.\deploy-to-git.ps1
```

```bash
# Linux/Mac
chmod +x deploy-to-git.sh
./deploy-to-git.sh
```

Then deploy via Dokploy UI → See instructions below.

---

## What You Need

### Before Starting

1. **Git Repository** (GitHub, GitLab, Bitbucket, etc.)
2. **Dokploy Instance** running
3. **Instagram App** from Meta for Developers
4. **Environment Variables** ready (see below)

### Required Environment Variables

```env
SESSION_SECRET=<generate with: openssl rand -hex 32>
INSTAGRAM_APP_ID=4224943747791118
INSTAGRAM_APP_SECRET=<from Meta dashboard>
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<any random string>
OAUTH_BASE_URL=https://yourdomain.com
```

---

## Step-by-Step Deploy

### 1. Push to Git (One Command)

**Windows:**
```powershell
.\deploy-to-git.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy-to-git.sh
./deploy-to-git.sh
```

The script will:
- ✅ Initialize git (if needed)
- ✅ Add all files
- ✅ Commit changes
- ✅ Add remote (if needed)
- ✅ Push to GitHub/GitLab

### 2. Deploy on Dokploy (3 Minutes)

1. **Login to Dokploy**
   ```
   https://your-dokploy-instance.com
   ```

2. **Create Application**
   - Click "New Application"
   - Name: `instagram-automation`

3. **Configure Source**
   - Source Type: **Git**
   - Repository: `https://github.com/yourusername/instagram-automation.git`
   - Branch: `main`
   - Build Method: **Docker Compose**

4. **Add Environment Variables**

   Click "Environment" tab and add:

   **Required:**
   ```env
   SESSION_SECRET=your_random_64_char_hex_string
   INSTAGRAM_APP_ID=4224943747791118
   INSTAGRAM_APP_SECRET=your_instagram_secret
   INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_verify_token
   OAUTH_BASE_URL=https://yourdomain.com
   POSTGRES_PASSWORD=your_secure_db_password
   ```

   **Optional:**
   ```env
   GEMINI_API_KEY=your_gemini_key
   FACEBOOK_APP_ID=your_fb_id
   FACEBOOK_APP_SECRET=your_fb_secret
   AUTO_SUBSCRIBE_WEBHOOKS=true
   WEBHOOK_FIELDS=comments,messages,mentions,story_insights
   ```

5. **Deploy!**
   - Click "Deploy" button
   - Wait 3-5 minutes for build
   - Application goes live! 🎉

### 3. Verify Deployment

```bash
curl https://yourdomain.com/api/health
```

Expected:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

---

## What Gets Deployed

### Services

- ✅ **PostgreSQL 16** - Database with persistent storage
- ✅ **Application** - Node.js + Express + React
- ✅ **Auto-Migration** - Database schema auto-created
- ✅ **Health Checks** - Automatic health monitoring

### Features

- ✅ **Auto Webhook Subscription** - Webhooks auto-subscribe when accounts connect
- ✅ **Visual Flow Builder** - Drag-and-drop automation
- ✅ **AI Agents** - Google Gemini integration
- ✅ **Multi-Account** - Manage multiple Instagram accounts
- ✅ **Activity Logs** - Track all executions

---

## Files Included in Deployment

### Essential Files

```
✅ docker-compose.yml     - Orchestration config
✅ Dockerfile             - Application container
✅ .dockerignore          - Exclude unnecessary files
✅ .gitignore             - Protect sensitive files
✅ .env.production        - Environment template
✅ package.json           - Dependencies
✅ All source code        - Complete application
```

### Documentation

```
📚 DOKPLOY_DEPLOY.md      - Complete deployment guide
📚 DEPLOY.md              - General deployment guide
📚 TROUBLESHOOTING_GUIDE.md - Debug & fix issues
📚 QUICK_REFERENCE.md     - Essential commands
📚 AUTO_WEBHOOK_STATUS.md - Webhook setup status
```

---

## Environment Variables Explained

| Variable | What It Does | Get It From |
|----------|--------------|-------------|
| `SESSION_SECRET` | Encrypts user sessions | `openssl rand -hex 32` |
| `INSTAGRAM_APP_ID` | Your Instagram App ID | Meta for Developers |
| `INSTAGRAM_APP_SECRET` | Instagram App Secret | Meta for Developers |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Verifies webhooks | Make up any secure string |
| `OAUTH_BASE_URL` | Your public URL | Your domain or Dokploy URL |
| `POSTGRES_PASSWORD` | Database password | Make up a secure password |
| `GEMINI_API_KEY` | AI agent functionality | Google AI Studio (optional) |

---

## Post-Deployment Setup

### 1. Configure Domain (Optional)

In Dokploy:
- Go to "Domains" tab
- Add: `instagram.yourdomain.com`
- Enable SSL (automatic Let's Encrypt)

### 2. Configure Instagram Webhooks

**Important:** Configure webhook endpoint in Meta:

1. Go to https://developers.facebook.com/apps/4224943747791118
2. Products → Webhooks → Instagram
3. Callback URL: `https://yourdomain.com/api/webhooks/instagram`
4. Verify Token: (same as `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`)
5. Click "Verify and Save"

The app handles verification automatically!

### 3. Test Everything

1. Open: `https://yourdomain.com`
2. Register/Login
3. Connect Instagram account
4. Create a flow
5. Test with real Instagram event

---

## Updating Your Deployment

```bash
# Make changes
git add .
git commit -m "Update: description"
git push

# Dokploy auto-deploys! (if webhook configured)
# Or click "Redeploy" in Dokploy dashboard
```

---

## Troubleshooting Quick Fixes

### Build Failed
```bash
# Check Dokploy build logs
# Common cause: Missing env vars
# Fix: Add all required variables
```

### Database Won't Start
```bash
# Check PostgreSQL password is set
POSTGRES_PASSWORD=your_password

# Verify in Dokploy logs
```

### Application Won't Start
```bash
# Check environment variables
# Ensure all REQUIRED vars are set
# View logs in Dokploy dashboard
```

### Webhooks Not Working
```bash
# 1. Check auto-subscription in logs
# 2. Manually subscribe:
POST /api/accounts/:id/subscribe-webhooks

# 3. Verify in Meta dashboard
```

---

## Quick Commands

```bash
# Push to Git
.\deploy-to-git.ps1  # Windows
./deploy-to-git.sh   # Linux/Mac

# Check deployment health
curl https://yourdomain.com/api/health

# View logs (in Dokploy)
Dashboard → Your App → Logs

# Redeploy
Dashboard → Your App → Redeploy

# Database backup
Dashboard → PostgreSQL → Backup
```

---

## Cost Estimate

### Dokploy Hosting

- **Small:** $5-10/month (1GB RAM, suitable for testing)
- **Medium:** $10-20/month (2GB RAM, suitable for small business)
- **Large:** $20-40/month (4GB RAM, suitable for multiple accounts)

### External Services (Optional)

- **Domain:** $10-15/year
- **Gemini API:** Free tier (60 requests/min)
- **Instagram/Facebook:** Free

---

## Production Checklist

Before going live:

- [ ] Pushed code to Git
- [ ] Configured Dokploy application
- [ ] Set all required environment variables
- [ ] Generated secure `SESSION_SECRET`
- [ ] Configured custom domain (optional)
- [ ] Enabled SSL certificate
- [ ] Configured Instagram webhooks in Meta
- [ ] Tested account connection
- [ ] Tested flow execution
- [ ] Configured database backups
- [ ] Set up monitoring/alerts

---

## Support

- **Deployment Guide:** `DOKPLOY_DEPLOY.md`
- **Troubleshooting:** `TROUBLESHOOTING_GUIDE.md`
- **Health Check:** `https://yourdomain.com/api/health`
- **Dokploy Docs:** https://docs.dokploy.com

---

## Summary

**Three Simple Steps:**

1. **Push to Git:** Run `.\deploy-to-git.ps1`
2. **Deploy on Dokploy:** Configure via UI (3 minutes)
3. **Configure Webhooks:** Set up in Meta for Developers

**That's it! Your Instagram automation platform is live! 🚀**

- ✅ Auto webhook subscription enabled
- ✅ Database auto-migrated
- ✅ Production-ready
- ✅ Scalable architecture
- ✅  SSL/HTTPS ready
- ✅ Health monitoring active

**Start automating your Instagram today!** 🎉
