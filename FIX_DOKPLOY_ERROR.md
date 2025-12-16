# 🔧 Fix Dokploy Build Configuration

## ❌ Current Error

```
/bin/sh: 3: cd: can't cd to /etc/dokploy/applications/web-isnta-oduzl0/code/Dockerfile
❌ The path /etc/dokploy/applications/web-isnta-oduzl0/code/Dockerfile does not exist
```

**Problem:** Dokploy is trying to use Dockerfile as a directory instead of a file.

---

## ✅ Solution: Use Docker Compose

### Step 1: Change Build Type

In Dokploy dashboard, go to your application settings:

**Build Type Section:**

```
Build Type
├─ ○ Dockerfile          ← DON'T SELECT THIS
├─ ○ Railpack
├─ ○ Nixpacks
├─ ○ Heroku Buildpacks
├─ ○ Paketo Buildpacks
├─ ○ Static
└─ ● Docker Compose      ← SELECT THIS!
```

### Step 2: Set Compose File Path

After selecting "Docker Compose", you'll see:

**Compose File Path:**
```
docker-compose.yml
```

That's it! Just enter `docker-compose.yml`

### Step 3: Save

Click the **"Save"** button

### Step 4: Redeploy

Click **"Redeploy"** to rebuild with correct settings

---

## Alternative: Fix Dockerfile Build (Not Recommended)

If you must use Dockerfile build instead of Docker Compose:

**Current (Wrong):**
```
Build Type: Dockerfile
Docker File: /               ← WRONG
Docker Context Path: /Dockerfile  ← WRONG
```

**Correct:**
```
Build Type: Dockerfile
Docker File: Dockerfile      ← Path to Dockerfile from repo root
Docker Context Path: .       ← Build context (root of repo)
Docker Build Stage: (empty)  ← Leave blank
```

---

## Why Docker Compose is Better

| Feature | Dockerfile | Docker Compose |
|---------|-----------|----------------|
| Database | Need to configure separately | ✅ Included (PostgreSQL) |
| Networking | Manual setup | ✅ Auto-configured |
| Volumes | Manual setup | ✅ Auto-configured |
| Health checks | Limited | ✅ Full support |
| Multi-service | No | ✅ Yes (app + db + adminer) |
| Our setup | Not optimized | ✅ Pre-configured |

---

## Exact Steps to Fix

### In Dokploy Dashboard:

1. **Go to your application** (`web-isnta-oduzl0`)

2. **Click "General" or "Settings" tab**

3. **Scroll to "Build Type" section**

4. **Change selection:**
   - ❌ Uncheck "Dockerfile"
   - ✅ Check "Docker Compose"

5. **New field appears: "Compose File Path"**
   - Enter: `docker-compose.yml`

6. **Click "Save"** button (bottom right)

7. **Click "Redeploy"** to rebuild

---

## Expected Result

After fixing, you should see:

```
✅ Cloning repository...
✅ Building services...
✅ Building postgres (postgres:16-alpine)
✅ Building app (from Dockerfile)
✅ Starting services...
✅ postgres is healthy
✅ app started
✅ Deployment successful!
```

---

## Verification

Once deployed successfully, test:

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

---

## Troubleshooting

### Still getting errors?

**Check:**
1. ✅ Build Type is "Docker Compose" (not Dockerfile)
2. ✅ Compose File Path is exactly `docker-compose.yml`
3. ✅ All 6 required environment variables are set
4. ✅ Repository URL is correct
5. ✅ Branch is `main`

### Environment variables missing?

Required variables:
```env
SESSION_SECRET=<your-generated-secret>
POSTGRES_PASSWORD=<your-generated-password>
INSTAGRAM_APP_ID=4224943747791118
INSTAGRAM_APP_SECRET=<your-secret>
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<your-token>
OAUTH_BASE_URL=https://your-domain.com
```

### Compose file not found?

Make sure you pushed `docker-compose.yml` to Git:

```bash
git add docker-compose.yml
git commit -m "Add docker-compose.yml"
git push
```

---

## Summary

**DO THIS:**
1. Select "Docker Compose" as Build Type ✅
2. Set Compose File Path to `docker-compose.yml` ✅
3. Save & Redeploy ✅

**DON'T DO THIS:**
1. Use "Dockerfile" build type ❌
2. Leave Docker File as `/` ❌
3. Set Docker Context Path to `/Dockerfile` ❌

---

**Your deployment will work after this fix!** 🚀
