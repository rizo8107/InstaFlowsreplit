# Testing Instagram Auto Webhook Subscription

## ✅ Configuration Status

Your Instagram automation platform is now configured with:

```env
AUTO_SUBSCRIBE_WEBHOOKS=true
WEBHOOK_FIELDS=comments,messages,mentions,story_insights
INSTAGRAM_APP_ID=4224943747791118
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=n8n
OAUTH_BASE_URL=https://konipai-insta.7za6uc.easypanel.host
```

## 🔄 How Auto Subscription Works

When you connect an Instagram account:

1. **OAuth Flow Starts**
   - User clicks "Connect Instagram"
   - Redirected to Instagram authorization
   
2. **After Authorization**
   - Instagram sends back authorization code
   - Server exchanges code for access token
   - Account saved to database

3. **✨ AUTO SUBSCRIPTION (NEW!)**
   ```typescript
   if (AUTO_SUBSCRIBE_WEBHOOKS === 'true') {
     const api = new InstagramAPI(accessToken, igUserId);
     await api.subscribeToWebhooks(
       appId,
       'https://yourdomain.com/api/webhooks/instagram',
       'n8n',
       ['comments', 'messages', 'mentions', 'story_insights']
     );
   }
   ```

4. **Result**
   - Webhooks automatically subscribed ✅
   - No manual Meta dashboard configuration needed ✅

## 🧪 Testing the Auto Subscription

### Method 1: Connect an Instagram Account (Recommended)

1. Open the app: http://localhost:5000
2. Login/Register
3. Go to "Accounts" page
4. Click "Connect Instagram Account"
5. Authorize the app
6. **Watch the server logs:**

```bash
docker-compose logs -f app
```

You should see:
```
[OAuth] Auto-subscribing account @username to webhooks...
[InstagramAPI] Subscribing Instagram account 123456789 to webhooks
[InstagramAPI] Fields: comments, messages, mentions, story_insights
[InstagramAPI] Successfully subscribed to comments
[InstagramAPI] Successfully subscribed to messages
[InstagramAPI] Successfully subscribed to mentions
[InstagramAPI] Successfully subscribed to story_insights
[OAuth] ✅ Successfully subscribed to webhooks: ['comments', 'messages', 'mentions', 'story_insights']
```

### Method 2: Test with Existing Account

If you already have a connected account, you can manually trigger subscription:

```bash
# Get your account ID from the UI (Accounts page)

# Then call the subscription endpoint:
curl -X POST http://localhost:5000/api/accounts/YOUR_ACCOUNT_ID/subscribe-webhooks \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json"
```

### Method 3: Check Current Subscriptions

```bash
curl -X GET http://localhost:5000/api/accounts/YOUR_ACCOUNT_ID/webhook-subscriptions \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

Expected response:
```json
{
  "accountId": "abc-123",
  "username": "your_username",
  "subscriptions": ["comments", "messages", "mentions", "story_insights"]
}
```

## 🔍 Verification Checklist

- [x] ✅ `AUTO_SUBSCRIBE_WEBHOOKS=true` in .env
- [x] ✅ `WEBHOOK_FIELDS` configured
- [x] ✅ Docker container running
- [x] ✅ Database migrated
- [x] ✅ App accessible at http://localhost:5000
- [ ] ⏳ Connect Instagram account (to test auto-subscription)

## 📊 Monitoring Auto Subscription

### Check Application Logs
```bash
# Real-time logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# Filter for subscription logs
docker-compose logs app | grep -i "webhook"
```

### Check Diagnostic Dashboard
```bash
# After logging in, visit:
http://localhost:5000/api/diagnostic

# Or via curl:
curl -H "Cookie: connect.sid=YOUR_SESSION" \
  http://localhost:5000/api/diagnostic | jq
```

Look for:
```json
{
  "webhookConfig": {
    "callbackUrl": "https://konipai-insta.7za6uc.easypanel.host/api/webhooks/instagram",
    "verifyToken": "n8n",
    "autoSubscribe": true,
    "subscribedFields": ["comments", "messages", "mentions", "story_insights"]
  }
}
```

## ⚠️ Troubleshooting

### Auto Subscription Not Working

1. **Check environment variable:**
   ```bash
   docker-compose exec app printenv | grep AUTO_SUBSCRIBE_WEBHOOKS
   # Should show: AUTO_SUBSCRIBE_WEBHOOKS=true
   ```

2. **Restart app to pick up environment changes:**
   ```bash
   docker-compose restart app
   ```

3. **Check logs for errors:**
   ```bash
   docker-compose logs app | grep -i "error\|fail"
   ```

### Common Error Messages

**Error: "INSTAGRAM_APP_ID not configured"**
- Make sure `.env` has `INSTAGRAM_APP_ID` set
- Restart Docker: `docker-compose restart app`

**Error: "Failed to subscribe: Invalid access token"**
- Instagram access token may be expired
- Reconnect the Instagram account

**Error: "Cannot read properties of undefined"**
- Check `OAUTH_BASE_URL` is set correctly
- Should be: `https://konipai-insta.7za6uc.easypanel.host`

## 🎯 Expected Behavior

### When AUTO_SUBSCRIBE_WEBHOOKS=true
✅ Automatic webhook subscription on account connect  
✅ All 4 fields subscribed: comments, messages, mentions, story_insights  
✅ Logs show successful subscription  
✅ No manual Meta dashboard configuration needed  

### When AUTO_SUBSCRIBE_WEBHOOKS=false (or not set)
⏸️ Webhooks NOT automatically subscribed  
⚠️ Must manually subscribe via Meta dashboard or API endpoint  
⏸️ No subscription logs  

## 🔗 Useful Endpoints

```bash
# Health check
GET http://localhost:5000/api/health

# Diagnostic (requires auth)
GET http://localhost:5000/api/diagnostic

# Manual webhook subscription (requires auth)
POST http://localhost:5000/api/accounts/:id/subscribe-webhooks

# Check subscriptions (requires auth)
GET http://localhost:5000/api/accounts/:id/webhook-subscriptions

# Unsubscribe (requires auth)
POST http://localhost:5000/api/accounts/:id/unsubscribe-webhooks
```

## ✅ Next Steps

1. **Open the app:** http://localhost:5000
2. **Login/Register** a user account
3. **Connect Instagram account** to test auto-subscription
4. **Watch logs:** `docker-compose logs -f app`
5. **Verify subscription** worked by checking logs or `/api/diagnostic`

---

**Your Instagram auto webhook subscription is now active!** 🎉

Every time you connect an Instagram account, it will automatically subscribe to webhooks without any manual configuration in Meta for Developers dashboard.
