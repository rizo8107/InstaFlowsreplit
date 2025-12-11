# 🚀 Ultra-Quick Dokploy Deploy (Auto-Configured)

## TL;DR - Only 6 Variables to Set!

With the new `dokploy.yaml`, you only need to configure **6 variables** in Dokploy UI:

```env
SESSION_SECRET=<openssl rand -hex 32>
POSTGRES_PASSWORD=<any secure password>
INSTAGRAM_APP_ID=4224943747791118
INSTAGRAM_APP_SECRET=<from Meta dashboard>
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<any random string>
OAUTH_BASE_URL=https://yourdomain.com
```

**Everything else is auto-configured!** ✨

---

## Step 1: Generate Secrets (30 seconds)

```powershell
# Generate SESSION_SECRET
openssl rand -hex 32

# Generate POSTGRES_PASSWORD
openssl rand -hex 16

# Generate WEBHOOK_VERIFY_TOKEN
openssl rand -hex 16
```

Copy these values - you'll need them in Step 3.

---

## Step 2: Push to Git (1 minute)

```powershell
# Windows
.\deploy-to-git.ps1

# Linux/Mac
chmod +x deploy-to-git.sh && ./deploy-to-git.sh
```

---

## Step 3: Deploy on Dokploy (2 minutes)

### A. Create Application

1. **Login to Dokploy**
2. **Click "New Application"**
3. **Configure:**
   - Name: `instagram-automation`
   - Source: Git
   - Repository: `https://github.com/yourusername/repo.git`
   - Branch: `main`
   - Build: **Docker Compose**

### B. Set ONLY These 6 Variables

Click "Environment" and add:

```env
SESSION_SECRET=<paste generated value>
POSTGRES_PASSWORD=<paste generated value>
INSTAGRAM_APP_ID=4224943747791118
INSTAGRAM_APP_SECRET=f1e085aec98dbcc6b880b7b53ca22235
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<paste generated value>
OAUTH_BASE_URL=https://instagram.yourdomain.com
```

### C. Deploy!

Click "Deploy" → Wait 3-5 minutes → Done! 🎉

---

## What's Auto-Configured

These are **automatically set** via `dokploy.yaml`:

✅ `AUTO_SUBSCRIBE_WEBHOOKS=true`  
✅ `WEBHOOK_FIELDS=comments,messages,mentions,story_insights`  
✅ `POSTGRES_USER=postgres`  
✅ `POSTGRES_DB=instagram_automation`  
✅ `PORT=5000`  
✅ `NODE_ENV=production`  

**You don't need to set these!**

---

## Optional Variables

Want AI features or Facebook integration? Add these:

```env
GEMINI_API_KEY=your_gemini_api_key
FACEBOOK_APP_ID=your_fb_app_id
FACEBOOK_APP_SECRET=your_fb_secret
```

---

## Step 4: Configure Instagram Webhooks (1 minute)

1. Go to https://developers.facebook.com/apps/4224943747791118
2. Products → Webhooks → Instagram
3. Callback URL: `https://instagram.yourdomain.com/api/webhooks/instagram`
4. Verify Token: `<your INSTAGRAM_WEBHOOK_VERIFY_TOKEN>`
5. Click "Verify and Save"

---

## Verify Deployment

```bash
curl https://instagram.yourdomain.com/api/health
```

Expected:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

## Complete Environment Reference

### Required (6 variables)

| Variable | How to Get | Example |
|----------|------------|---------|
| `SESSION_SECRET` | `openssl rand -hex 32` | `a1b2c3...` (64 chars) |
| `POSTGRES_PASSWORD` | `openssl rand -hex 16` | `x1y2z3...` (32 chars) |
| `INSTAGRAM_APP_ID` | Meta for Developers | `4224943747791118` |
| `INSTAGRAM_APP_SECRET` | Meta for Developers | `f1e085aec...` |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | `openssl rand -hex 16` | `v1w2x3...` |
| `OAUTH_BASE_URL` | Your domain | `https://ig.yourdomain.com` |

### Auto-Configured (22 variables)

These are set automatically in `dokploy.yaml`:

```yaml
✅ AUTO_SUBSCRIBE_WEBHOOKS: true
✅ WEBHOOK_FIELDS: comments,messages,mentions,story_insights
✅ POSTGRES_USER: postgres
✅ POSTGRES_DB: instagram_automation
✅ POSTGRES_PORT: 5432
✅ PORT: 5000
✅ NODE_ENV: production
... and 15 more
```

### Optional (3 variables)

Only add if you need these features:

```env
GEMINI_API_KEY=            # For AI agents
FACEBOOK_APP_ID=           # For Facebook integration
FACEBOOK_APP_SECRET=       # For Facebook integration
```

---

## Why This is Better

### Before (28 variables to configure manually)

```env
SESSION_SECRET=...
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=...
OAUTH_BASE_URL=...
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...
POSTGRES_DB=instagram_automation
POSTGRES_PORT=5432
AUTO_SUBSCRIBE_WEBHOOKS=true
WEBHOOK_FIELDS=comments,messages,mentions,story_insights
PORT=5000
NODE_ENV=production
... and 15 more
```

### After (6 variables + auto-config)

```env
SESSION_SECRET=...
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=...
OAUTH_BASE_URL=...
POSTGRES_PASSWORD=...

# Everything else is auto-configured! ✨
```

**22 fewer variables to configure!** 🎉

---

## How It Works

1. **`dokploy.yaml`** defines all environment variables with defaults
2. **Dokploy** reads this file on deployment
3. **Docker Compose** uses these values automatically
4. **You** only override the 6 required values

---

## Troubleshooting

### "Environment variable not found"

**Solution:** Check you set all 6 required variables in Dokploy UI.

### "Database connection failed"

**Solution:** Verify `POSTGRES_PASSWORD` is set correctly.

### "Webhook verification failed"

**Solution:** Ensure `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` matches in:
- Dokploy environment
- Meta webhook configuration

---

## Update Deployment

```bash
git add .
git commit -m "Update"
git push

# Dokploy auto-deploys (if enabled)
# Or click "Redeploy" in dashboard
```

---

## Files That Enable Auto-Config

```
✅ dokploy.yaml          - Dokploy configuration with defaults
✅ docker-compose.yml    - Uses environment variable substitution
✅ .env.production       - Template with only required vars
✅ Dockerfile            - Production-ready build
```

---

## Summary

**Old Way:**
- Set 28+ environment variables manually
- Easy to forget one
- Lots of copy-paste
- Error-prone

**New Way:**
- Set only 6 required variables
- Everything else auto-configured
- Foolproof deployment
- Production best practices built-in

**Deploy in 3 minutes with 6 variables!** 🚀

---

## Next Steps

1. **Generate secrets:**
   ```bash
   openssl rand -hex 32  # SESSION_SECRET
   openssl rand -hex 16  # POSTGRES_PASSWORD
   openssl rand -hex 16  # WEBHOOK_VERIFY_TOKEN
   ```

2. **Push to Git:**
   ```bash
   .\deploy-to-git.ps1
   ```

3. **Deploy on Dokploy:**
   - Set 6 variables
   - Click Deploy
   - Wait 3 minutes

4. **Configure webhooks in Meta**

5. **Start using!**

**Your Instagram automation platform is production-ready in minutes!** ✨
