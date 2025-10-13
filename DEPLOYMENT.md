# Deployment Guide

## 🚀 Deployment Options

### ✅ Option 1: Replit (Recommended - Easiest)
1. Click the **Publish** button in Replit
2. Your app will be live with a `.replit.app` domain
3. Webhook URL and all features work automatically
4. Database, secrets, and environment managed for you

---

### ✅ Option 2: Easypanel (Docker Deployment)

#### Prerequisites
- Easypanel instance or Docker-enabled server
- PostgreSQL database (or use docker-compose)

#### Quick Deploy Steps

**1. Clone Repository**
```bash
git clone <your-repo-url>
cd instagram-automation-platform
```

**2. Configure Environment**
```bash
cp .env.example .env
# Edit .env with your credentials
nano .env
```

**3. Deploy with Docker Compose**
```bash
docker-compose up -d
```

**4. Access Application**
- App: `http://your-server:5000`
- Configure Instagram webhooks with your domain

#### Easypanel Specific Setup

**In Easypanel Dashboard:**
1. Create New App → Docker Compose
2. Paste `docker-compose.yml` content
3. Set Environment Variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `INSTAGRAM_APP_ID`
   - `INSTAGRAM_APP_SECRET`
   - `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
4. Deploy
5. Configure domain/SSL
6. Update Instagram webhook URL in Meta for Developers

---

### ✅ Option 3: VPS/Cloud Server (Manual)

#### On Ubuntu/Debian Server:

**1. Install Dependencies**
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql

# Install PM2 for process management
sudo npm install -g pm2
```

**2. Setup PostgreSQL**
```bash
sudo -u postgres psql
CREATE DATABASE instagram_automation;
CREATE USER appuser WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE instagram_automation TO appuser;
\q
```

**3. Clone & Setup Application**
```bash
git clone <your-repo-url>
cd instagram-automation-platform
npm install
npm run build
```

**4. Configure Environment**
```bash
cp .env.example .env
nano .env
# Set DATABASE_URL and other variables
```

**5. Run Database Migration**
```bash
npm run db:push
```

**6. Start with PM2**
```bash
pm2 start npm --name "instagram-automation" -- start
pm2 save
pm2 startup
```

**7. Setup Nginx Reverse Proxy**
```bash
sudo apt-get install nginx
```

Create `/etc/nginx/sites-available/instagram-automation`:
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
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### ❌ NOT Recommended: Netlify

**Why Netlify doesn't work:**
- Netlify is for static sites and serverless functions
- This app requires a persistent Express server for webhooks
- Real-time Instagram webhooks need always-on backend

**Alternative:** Use Netlify for frontend + separate backend on:
- Railway
- Render
- DigitalOcean App Platform
- Fly.io
- Heroku

---

## 🔐 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Session encryption key | Generate with `openssl rand -hex 32` |
| `INSTAGRAM_APP_ID` | Meta App ID | From Meta for Developers |
| `INSTAGRAM_APP_SECRET` | Meta App Secret | From Meta for Developers |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Webhook verification | Default: `zenthra` |
| `PORT` | Server port | Default: `5000` |
| `NODE_ENV` | Environment | `production` |

---

## 📱 Post-Deployment Setup

1. **Get Your Webhook URL**
   - Replit: `https://your-app.replit.app/api/webhooks/instagram`
   - Custom: `https://your-domain.com/api/webhooks/instagram`

2. **Configure Meta for Developers**
   - Go to Meta for Developers console
   - Navigate to Products → Webhooks
   - Add callback URL (your webhook URL)
   - Enter verify token: `zenthra`
   - Subscribe to: `comments`, `messages`, `mentions`

3. **Set Privacy & Terms URLs**
   - Privacy Policy: `https://your-domain.com/privacy`
   - Terms of Service: `https://your-domain.com/terms`

4. **Connect Instagram Accounts**
   - Log into your app
   - Go to Accounts page
   - Add Instagram accounts with Graph API tokens

---

## 🐛 Troubleshooting

**Database Connection Issues:**
```bash
# Check database status
sudo systemctl status postgresql

# Verify connection
psql $DATABASE_URL -c "SELECT 1"
```

**Webhook Not Working:**
- Check webhook URL is publicly accessible
- Verify SSL certificate is valid
- Check verify token matches (`zenthra`)
- Review server logs

**PM2 Issues:**
```bash
# View logs
pm2 logs instagram-automation

# Restart app
pm2 restart instagram-automation
```

---

## 📊 Monitoring

**PM2 Monitoring:**
```bash
pm2 monit
```

**Docker Logs:**
```bash
docker-compose logs -f app
```

---

## 🔄 Updates

**With PM2:**
```bash
git pull
npm install
npm run build
npm run db:push
pm2 restart instagram-automation
```

**With Docker:**
```bash
git pull
docker-compose down
docker-compose up -d --build
```
