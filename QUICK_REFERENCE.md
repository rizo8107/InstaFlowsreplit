# 🚀 Quick Reference Card

## One-Command Deployment

```bash
# Windows
.\setup.ps1 && docker-compose up -d

# Linux/Mac  
chmod +x setup.sh && ./setup.sh && docker-compose up -d
```

## Essential Endpoints

```bash
# Health Check
GET /api/health

# Diagnostic Dashboard (requires auth)
GET /api/diagnostic

# Subscribe Account to Webhooks
POST /api/accounts/:id/subscribe-webhooks

# Check Webhook Subscriptions
GET /api/accounts/:id/webhook-subscriptions

# Manual Flow Trigger (for testing)
POST /api/flows/:id/trigger
Body: {"webhookPayload": {"comment_text": "test"}}
```

## Docker Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop everything
docker-compose down

# Reset database (DELETES ALL DATA!)
docker-compose down -v && docker-compose up -d

# Database UI
docker-compose --profile debug up -d adminer
# Access: http://localhost:8080
```

## Troubleshooting

```bash
# Check if services are running
docker-compose ps

# Check app health
curl http://localhost:5000/api/health

# View recent logs
docker-compose logs --tail=50 app

# Restart app
docker-compose restart app

# Run migration manually
docker-compose exec app npm run db:push

# Access database directly
docker-compose exec postgres psql -U postgres instagram_automation
```

## Environment Setup

```env
# Required
SESSION_SECRET=<openssl rand -hex 32>
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_secret
OAUTH_BASE_URL=https://yourdomain.com

# Webhook Auto-Subscribe
AUTO_SUBSCRIBE_WEBHOOKS=true
WEBHOOK_FIELDS=comments,messages,mentions,story_insights
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Database connection failed | `docker-compose up -d postgres` |
| Webhook not subscribing | Set `AUTO_SUBSCRIBE_WEBHOOKS=true` |
| Flow not executing | Check flow is Active, use `/api/diagnostic` |
| Activity page empty | Check `/api/diagnostic` for execution logs |

## File Locations

```
📁 Project Root
├── docker-compose.yml       # Main orchestration file
├── .env                     # Your configuration (create from .env.production)
├── setup.ps1 / setup.sh     # Automated setup scripts
│
├── 📚 Documentation
│   ├── DEPLOY.md                      # Complete deployment guide
│   ├── TROUBLESHOOTING_GUIDE.md       # Diagnostic guide
│   ├── FLOW_EXECUTION_MAP.md          # Visual flow diagram
│   ├── COMPLETE_INTEGRATION.md        # What was done
│   └── LOCAL_SET UP.md                 # Local development
│
└── 🔧 Server Code
    ├── server/routes.ts               # API endpoints
    └── server/instagram-api.ts        # Instagram/webhook methods
```

## URLs

```bash
# Application
http://localhost:5000

# Health Check
http://localhost:5000/api/health

# Database UI (Adminer)
http://localhost:8080

# Meta for Developers
https://developers.facebook.com/apps

# Webhook Setup
Callback URL: {OAUTH_BASE_URL}/api/webhooks/instagram
Verify Token: {INSTAGRAM_WEBHOOK_VERIFY_TOKEN}
```

## Testing Workflow

```bash
# 1. Start services
docker-compose up -d

# 2. Check health
curl http://localhost:5000/api/health

# 3. Login to app
open http://localhost:5000

# 4. Connect Instagram account (auto-subscribes to webhooks)

# 5. Create and activate a flow

# 6. Test manually
curl -X POST \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"webhookPayload": {"comment_text": "test"}}' \
  http://localhost:5000/api/flows/FLOW_ID/trigger

# 7. Check diagnostic
curl -H "Cookie: connect.sid=YOUR_SESSION" \
  http://localhost:5000/api/diagnostic
```

## Key Files Changed

✅ `server/instagram-api.ts` - Added 3 webhook management methods  
✅ `server/routes.ts` - Added auto-subscription + 4 new endpoints  
✅ `docker-compose.yml` - Complete Docker setup  
✅ `.env.production` - Environment template  
✅ `setup.ps1` / `setup.sh` - Automated setup  

## What Was Fixed

1. ✅ Automatic webhook subscription on account connect
2. ✅ Manual webhook subscription endpoints
3. ✅ Diagnostic dashboard for debugging
4. ✅ Manual flow trigger for testing
5. ✅ Complete Docker Compose deployment
6. ✅ Automated setup scripts
7. ✅ Comprehensive documentation

---

**Need help?** Check `DEPLOY.md` for full guide or `TROUBLESHOOTING_GUIDE.md` for diagnostics.
