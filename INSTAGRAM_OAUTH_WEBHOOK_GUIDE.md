# Instagram OAuth & Webhook Setup Guide

## ✅ What's Fixed

The Instagram authentication and webhook subscription flow has been completely updated to follow Instagram/Meta's official best practices:

### Key Improvements

1. **✅ Correct API Endpoints**
   - Now uses `graph.facebook.com` (NOT `graph.instagram.com`) for webhook subscriptions
   - Follows Instagram Graph API v24.0 specifications

2. **✅ Proper Token Usage**
   - DM webhooks: Uses **Page Access Token** to subscribe the Facebook Page
   - Content webhooks: Uses **User Access Token** to subscribe the Instagram account

3. **✅ Correct Webhook Fields**
   - DM fields: `messages,message_reactions,message_echoes,messaging_postbacks`
   - Content fields: `comments,mentions,live_comments,story_insights`

4. **✅ Fast Webhook ACK**
   - Responds with `200 OK` within 1 second
   - Processes flows async in background
   - Prevents Instagram timeout/retry issues

5. **✅ Enhanced Security**
   - HMAC SHA256 signature validation on all webhooks
   - DoS attack prevention
   - Timing-safe comparison

---

## 🔧 Setup Requirements

### Environment Variables (Required)

Add these to your Replit Secrets or `.env`:

```bash
# Instagram App Credentials
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret

# Webhook Configuration
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=zenthra  # Hardcoded for simplicity
OAUTH_BASE_URL=https://your-replit-app.repl.co  # Your public URL

# Database
DATABASE_URL=your_postgres_url

# Session
SESSION_SECRET=your_session_secret
```

### Meta App Dashboard Configuration

1. **Create Instagram Graph API App**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create New App → Business → Instagram
   - Add products: Instagram → Webhooks

2. **Configure OAuth Settings**
   - App Settings → Basic
   - Valid OAuth Redirect URIs: `https://your-replit-app.repl.co/api/auth/instagram/callback`

3. **Configure Webhooks** (One-time setup)
   - Products → Webhooks → Instagram
   - Callback URL: `https://your-replit-app.repl.co/api/webhooks/instagram`
   - Verify Token: `zenthra`
   - Subscribe to fields: `comments`, `mentions`, `story_insights`, `live_comments`

4. **Permissions** (Add in App Review)
   - `instagram_business_basic` (default)
   - `instagram_business_manage_messages`
   - `instagram_business_manage_comments`
   - `instagram_business_content_publish`

---

## 🚀 How It Works

### Step 1: User Connects Instagram Account

1. User clicks "Connect Instagram Account" in your app
2. Redirects to Instagram OAuth: `/api/auth/instagram`
3. User authorizes permissions
4. Callback receives authorization code: `/api/auth/instagram/callback`

### Step 2: Token Exchange

1. Exchange code for **short-lived access token**
2. Exchange for **long-lived token** (60-day validity)
3. Fetch Instagram profile details
4. Save account to database

### Step 3: Automatic Webhook Subscription

After OAuth, the system automatically:

1. **Gets Facebook Page Info**
   ```
   GET graph.facebook.com/v24.0/me/accounts
   ?fields=id,name,access_token,instagram_business_account
   &access_token={USER_TOKEN}
   ```

2. **Subscribes Page to DM Webhooks** (MUST use Page Token)
   ```
   POST graph.facebook.com/v24.0/{PAGE_ID}/subscribed_apps
   subscribed_fields=messages,message_reactions,message_echoes,messaging_postbacks
   access_token={PAGE_TOKEN}
   ```

3. **Subscribes IG Account to Content Webhooks** (Optional)
   ```
   POST graph.facebook.com/v24.0/{IG_USER_ID}/subscribed_apps
   subscribed_fields=comments,mentions,live_comments,story_insights
   access_token={USER_TOKEN}
   ```

### Step 4: Webhook Processing

When Instagram sends a webhook:

1. **Signature Validation** (< 1ms)
   - Validates `X-Hub-Signature-256` header
   - Uses HMAC SHA256 with App Secret
   - Rejects if invalid (403 Forbidden)

2. **Fast ACK** (< 1s)
   - Returns `200 OK` immediately
   - Instagram requirement: respond within 20s

3. **Async Processing** (background)
   - Identifies Instagram account
   - Creates webhook event record
   - Matches flows with trigger type
   - Executes flows in background
   - Updates execution status

---

## 🧪 Testing

### 1. Test OAuth Flow

```bash
# Open in browser
https://your-app.repl.co/api/auth/instagram

# Should redirect to Instagram
# After auth, check logs for:
✅ Found linked Page: "Your Page Name" (123456789)
✅ Page successfully subscribed to DM webhooks!
✅ IG account successfully subscribed to content webhooks!
```

### 2. Test Webhook Verification

```bash
# Meta will call this during setup
GET /api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=zenthra&hub.challenge=test123

# Expected response: test123
# Logs should show:
✅ Webhook verified successfully!
```

### 3. Test DM Webhook

```bash
# Send a DM to your connected Instagram account
# Check logs for:
✅ Webhook signature validated
[IG WEBHOOK] received: {"object":"instagram","entry":[...]}
Processing webhook for Instagram user ID: 123456789
Saving DM webhook event for account: @your_username
```

### 4. Test Comment Webhook

```bash
# Comment on your Instagram post
# Check logs for:
✅ Webhook signature validated
[IG WEBHOOK] received: {"object":"instagram","entry":[...]}
Processing webhook for Instagram user ID: 123456789
Saving webhook event: comment_received for account: @your_username
```

### 5. Check Webhook Status

```bash
# Via authenticated endpoint
GET /api/webhook-status

# Via debug endpoint (for cURL testing)
curl "https://your-app.repl.co/api/webhook-debug?instagramUserId=123&accessToken=xxx"

# Expected response:
{
  "app": {
    "callbackUrl": "https://your-app.repl.co/api/webhooks/instagram",
    "verifyToken": "✅ Set"
  },
  "appSubscriptions": [...],
  "page": {
    "id": "123456789",
    "name": "Your Page",
    "subscriptions": {
      "subscribed_fields": ["messages", "message_reactions", ...]
    }
  },
  "instagramAccount": {
    "id": "987654321",
    "linkedPage": "123456789"
  }
}
```

---

## 🔍 Debugging

### Common Issues

#### 1. "No Facebook Page found"

**Problem:** User doesn't have a Facebook Page linked to Instagram

**Solution:**
- Instagram Business/Creator accounts must be linked to a Facebook Page
- Go to Instagram → Settings → Account → Linked accounts → Facebook
- Ensure Page has Admin access

#### 2. "Page subscription failed"

**Problem:** Missing permissions or invalid token

**Solution:**
- Verify `pages_show_list` permission in OAuth scopes (may require App Review)
- Check Page Access Token is valid
- Ensure user is Page admin

#### 3. "No webhooks received"

**Problem:** User hasn't enabled device setting

**Solution:**
- In Instagram mobile app:
  - Settings → Privacy → Messages → Connected Tools
  - Enable "Allow access to messages" = ON
- This setting CANNOT be automated, user must do it manually

#### 4. "Signature validation failed"

**Problem:** `INSTAGRAM_APP_SECRET` mismatch or missing

**Solution:**
```bash
# Check secret is set
echo $INSTAGRAM_APP_SECRET

# Ensure it matches Meta App Dashboard → Settings → Basic → App Secret
```

#### 5. "Webhook timeout/retries"

**Problem:** Slow processing before ACK

**Solution:**
- Fixed! Now ACKs within 1s, processes async
- Check logs for `[IG WEBHOOK] Background processing error` if flows fail

---

## 📊 Monitoring

### Logs to Watch

**Startup:**
```
📱 Instagram Webhook Service Initialized:
   Callback URL: https://your-app.repl.co/api/webhooks/instagram
   Verify Token: ✅ Set
   App ID: ✅ Set
   App Secret: ✅ Set
```

**OAuth Success:**
```
🔄 Starting automatic webhook subscription...
📄 Step 1: Fetching Facebook Pages...
✅ Found linked Page: "Your Page" (123)
📨 Step 2: Subscribing Page to DM webhooks...
✅ Page successfully subscribed to DM webhooks!
💬 Step 3: Subscribing IG account to content webhooks...
✅ IG account successfully subscribed to content webhooks!
```

**Webhook Received:**
```
✅ Webhook signature validated
[IG WEBHOOK] received: {"object":"instagram",...}
Processing webhook for Instagram user ID: 123456789
Saving DM webhook event for account: @username
Flow execution completed: abc-123 success
```

**Errors:**
```
❌ Failed to fetch Facebook Pages: {...}
🚨 SECURITY: Invalid webhook signature - possible forged request!
[IG WEBHOOK] Background processing error: {...}
```

---

## ⚠️ Important Notes

### 1. User Device Setting (Cannot Be Automated)

Users MUST manually enable DM webhooks in their Instagram app:
- **Path:** Settings → Privacy → Messages → Connected Tools → "Allow access to messages" = ON
- **Impact:** Without this, DM webhooks won't be sent
- **UI:** Show banner/tooltip to guide users

### 2. Graph API Endpoints

**✅ CORRECT:**
```javascript
// Use graph.facebook.com for subscriptions
fetch('https://graph.facebook.com/v24.0/PAGE_ID/subscribed_apps', ...)
```

**❌ WRONG:**
```javascript
// DON'T use graph.instagram.com for subscriptions
fetch('https://graph.instagram.com/v24.0/IG_ID/subscribed_apps', ...)
```

### 3. Token Types Matter

- **Page subscriptions** (DMs): MUST use **Page Access Token**
- **IG subscriptions** (comments): Use **User Access Token**
- Using wrong token type = subscription fails silently

### 4. Webhook Security

- **ALL webhooks** are validated with HMAC SHA256 signature
- Invalid signatures return `403 Forbidden`
- No webhook processing without valid signature
- Protects against forged/spam requests

---

## 🚀 Deployment Checklist

- [ ] Set all environment variables in production
- [ ] Configure Meta App Dashboard (OAuth + Webhooks)
- [ ] Test OAuth flow end-to-end
- [ ] Verify webhook signature validation works
- [ ] Test DM webhook (send test message)
- [ ] Test comment webhook (post test comment)
- [ ] Check `/api/webhook-status` shows healthy status
- [ ] Monitor logs for any errors
- [ ] Add user guidance for "Allow access to messages" setting
- [ ] Set up monitoring/alerts for webhook failures

---

## 📚 References

- [Instagram Graph API - Webhooks](https://developers.facebook.com/docs/instagram-platform/webhooks)
- [Instagram Graph API - Subscriptions](https://developers.facebook.com/docs/graph-api/webhooks/subscriptions)
- [Instagram Business Login](https://developers.facebook.com/docs/instagram-basic-display-api/overview)
- [Webhook Security](https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests)

---

**Status:** ✅ Production Ready  
**Last Updated:** Based on Instagram Graph API v24.0  
**Security:** ✅ Signature validated, DoS protected, timing-safe comparison
