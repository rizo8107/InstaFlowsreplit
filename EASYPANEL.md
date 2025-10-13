# Easypanel Deployment Guide

## 🚀 One-Click Deploy to Easypanel

### Method 1: Using Easypanel UI (Recommended)

1. **Login to Easypanel Dashboard**
   - Go to your Easypanel instance
   - Click "Create" → "Project"

2. **Import Docker Compose**
   - Choose "Docker Compose" template
   - Paste the contents of `docker-compose.yml`

3. **Configure Secrets**
   In Easypanel secrets section, add:
   ```
   SESSION_SECRET=<generate-with-openssl-rand-hex-32>
   INSTAGRAM_APP_ID=<your-meta-app-id>
   INSTAGRAM_APP_SECRET=<your-meta-app-secret>
   POSTGRES_PASSWORD=<strong-database-password>
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - App will be running on port 5000

5. **Configure Domain**
   - Go to "Domains" tab
   - Add your domain
   - Point DNS to Easypanel server
   - Enable SSL/TLS

6. **Setup Instagram Webhooks**
   - Go to Meta for Developers
   - Webhooks → Add Callback URL:
     ```
     https://your-domain.com/api/webhooks/instagram
     ```
   - Verify Token: `zenthra`
   - Subscribe to: `comments`, `messages`, `mentions`

### Method 2: Using Git Repository

1. **Connect Repository**
   - In Easypanel, create new app
   - Choose "GitHub" or "GitLab"
   - Select your repository

2. **Configure Build**
   - Build Type: Dockerfile
   - Dockerfile path: `./Dockerfile`
   - Port: 5000

3. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/instagram_automation
   SESSION_SECRET=${SESSION_SECRET}
   INSTAGRAM_APP_ID=${INSTAGRAM_APP_ID}
   INSTAGRAM_APP_SECRET=${INSTAGRAM_APP_SECRET}
   INSTAGRAM_WEBHOOK_VERIFY_TOKEN=zenthra
   ```

4. **Add PostgreSQL Database**
   - Create new service
   - Choose PostgreSQL 16
   - Set database name: `instagram_automation`
   - Note the connection details

5. **Deploy & Monitor**
   - Click Deploy
   - Monitor logs in real-time
   - Check health status

### Method 3: CLI Deployment

```bash
# Install Easypanel CLI
npm install -g easypanel-cli

# Login
easypanel login

# Deploy
easypanel deploy --config easypanel.yml
```

---

## 🔧 Configuration

### Required Secrets

| Secret | How to Generate | Example |
|--------|----------------|---------|
| `SESSION_SECRET` | `openssl rand -hex 32` | `a1b2c3d4e5f6...` |
| `INSTAGRAM_APP_ID` | Meta for Developers | `123456789012345` |
| `INSTAGRAM_APP_SECRET` | Meta for Developers | `abc123def456...` |
| `POSTGRES_PASSWORD` | Choose strong password | `MyStr0ngP@ssw0rd!` |

### Database Connection

The app automatically connects to PostgreSQL using `DATABASE_URL`:
```
postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/instagram_automation
```

---

## 📊 Post-Deployment

### 1. Access Your App
```
https://your-domain.com
```

### 2. Create Admin Account
- Go to `/auth`
- Register first user account

### 3. Configure Meta for Developers

**Webhook Settings:**
- Callback URL: `https://your-domain.com/api/webhooks/instagram`
- Verify Token: `zenthra`
- Subscribe to fields: `comments`, `messages`, `mentions`

**App Settings:**
- Privacy Policy URL: `https://your-domain.com/privacy`
- Terms of Service URL: `https://your-domain.com/terms`

### 4. Connect Instagram Account
- Login to your app
- Go to Accounts page
- Add Instagram Business account with access token

---

## 🔍 Monitoring

### View Logs
In Easypanel dashboard:
- Go to your app
- Click "Logs" tab
- Filter by service (app/postgres)

### Health Check
```bash
curl https://your-domain.com/api/accounts
```

### Database Access
```bash
# Via Easypanel terminal
psql postgresql://postgres:password@postgres:5432/instagram_automation
```

---

## 🔄 Updates

### Automatic Updates (Git)
- Enable auto-deploy in Easypanel
- Push to main branch
- App rebuilds automatically

### Manual Update
1. Pull latest code
2. Click "Rebuild" in Easypanel
3. Wait for deployment

---

## 🐛 Troubleshooting

### App Won't Start
Check logs for:
- Missing environment variables
- Database connection errors
- Port conflicts

### Database Connection Failed
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL
```

### Webhooks Not Working
- Verify domain has valid SSL certificate
- Check webhook URL is publicly accessible
- Confirm verify token matches (`zenthra`)
- Review app logs for webhook events

### Build Failures
- Check Node.js version (requires 20+)
- Verify all dependencies in package.json
- Clear build cache and retry

---

## 📈 Scaling

### Increase Resources
In Easypanel:
- Go to app settings
- Adjust CPU/Memory limits
- Save and redeploy

### Horizontal Scaling
- Increase replicas in `easypanel.yml`
- Add load balancer
- Configure session store (Redis recommended)

### Database Performance
- Increase PostgreSQL memory
- Add read replicas
- Enable connection pooling

---

## 🔐 Security Checklist

- [ ] Strong `SESSION_SECRET` generated
- [ ] Database password is strong
- [ ] SSL/TLS enabled for domain
- [ ] Firewall configured (only ports 80, 443)
- [ ] Environment secrets not in code
- [ ] Regular backups enabled
- [ ] Rate limiting configured
- [ ] CORS properly set

---

## 💾 Backup & Restore

### Backup Database
```bash
docker exec postgres pg_dump -U postgres instagram_automation > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker exec -i postgres psql -U postgres instagram_automation
```

### Automatic Backups
Enable in Easypanel:
- Database settings → Backups
- Set schedule (daily recommended)
- Configure retention policy

---

## 🎯 Performance Tips

1. **Enable Caching**
   - Add Redis for session storage
   - Cache Instagram API responses

2. **Optimize Database**
   - Add indexes for frequent queries
   - Regular VACUUM operations

3. **CDN Integration**
   - Serve static assets via CDN
   - Cache media thumbnails

4. **Monitoring**
   - Set up uptime monitoring
   - Configure alerts for errors
   - Track webhook delivery rates

---

## 📞 Support

**Easypanel Issues:**
- Easypanel Discord/Support

**App Issues:**
- GitHub Issues
- Documentation

**Instagram API:**
- Meta for Developers Support
