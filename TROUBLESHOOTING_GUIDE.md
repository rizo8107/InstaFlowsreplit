# Troubleshooting Guide: Instagram Auth & Flow Execution Issues

## Your Reported Issues

1. **Webhook subscription failing**
2. **Flow and activity not mapping properly** - automation and Instagram are added but flows/activity not working

---

## Issue 1: Instagram Authentication & Webhook Subscription

### How Instagram Auth Currently Works

Your app uses **Instagram Business Login** (NOT Facebook Login):

#### Authentication Flow:
```
1. User clicks "Connect Instagram" 
   → /api/auth/instagram/start

2. Redirects to Instagram OAuth:
   https://www.instagram.com/oauth/authorize
   Scopes requested:
   - instagram_business_basic
   - instagram_business_manage_messages
   - instagram_business_manage_comments
   - instagram_business_content_publish

3. User authorizes → Instagram redirects to:
   /api/auth/instagram/callback?code=xxx

4. Server exchanges code for access token:
   - Gets short-lived token (60 days)
   - Fetches username from Graph API
   - Saves to database: instagramAccounts table

5. Redirects to /accounts page
```

### ⚠️ CRITICAL ISSUE: Webhook Subscription

**The app does NOT automatically subscribe to webhooks after connecting an account!**

Looking at the code, there is **NO automatic webhook subscription** in the OAuth callback. You must manually subscribe in Meta for Developers dashboard.

### Required Webhook Setup (Manual)

#### Step 1: Get Instagram Account ID
After connecting your Instagram account, the system saves the `instagramUserId` in the database. You need this ID to subscribe webhooks.

Check your connected account:
```sql
SELECT instagramUserId, username FROM instagram_accounts;
```

#### Step 2: Subscribe to Webhooks in Meta for Developers

1. Go to https://developers.facebook.com/apps
2. Select your app (ID: 4224943747791118)
3. Navigate to **Products** → **Webhooks**
4. Click **Instagram** → **Subscribe to this object**
5. Configure webhook fields:
   - ✅ comments
   - ✅ messages  
   - ✅ mentions
   - ✅ story_insights

#### Step 3: Set Callback URL
- **Callback URL**: `https://konipai-insta.7za6uc.easypanel.host/api/webhooks/instagram`
- **Verify Token**: `n8n` (from your .env: INSTAGRAM_WEBHOOK_VERIFY_TOKEN)

#### Step 4: Subscribe Individual Instagram Account
**IMPORTANT**: You must subscribe EACH Instagram account individually:

1. In Meta dashboard → Webhooks → Instagram
2. Click **Configure** next to the webhook you created
3. Click **Add Page Subscriptions** or **Manage Instagram Subscriptions**
4. Select your Instagram Business Account
5. Click **Subscribe**

### Verification Test

Test webhook verification endpoint:
```bash
curl "https://konipai-insta.7za6uc.easypanel.host/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=n8n&hub.challenge=test123"

# Should return: test123
```

---

## Issue 2: Flow & Activity Not Mapping

### How Flow Execution Works

When a webhook event arrives, here's what happens:

```javascript
// routes.ts lines 837-896 (for DMs)
// routes.ts lines 1041-1115 (for comments/mentions)

1. Webhook received → POST /api/webhooks/instagram
2. System extracts Instagram User ID from webhook payload
3. Finds matching account: await storage.getAccountByUserId(instagramUserId)
4. Creates webhook event record (accountId, eventType, payload)
5. Finds ACTIVE flows: await storage.getActiveFlows()
6. Filters flows matching:
   - flow.accountId === account.id
   - flow has trigger node with matching triggerType
   - (optional) media filter matches if enabled
7. For each matching flow:
   - Creates execution record (status: "running")
   - Executes flow with FlowEngine
   - Updates execution (status: "success" or "failed")
8. Marks webhook as processed
```

### Common Issues & Solutions

#### ❌ Issue: "Instagram account added but no flows executing"

**Root Causes:**

1. **Instagram User ID Mismatch**
   - Webhook has Instagram User ID: `123456789`
   - Database account has different ID: `987654321`
   - Solution: Check `instagramUserId` field in database matches webhook

   ```javascript
   // The system tries to auto-update the first account if no match:
   // routes.ts lines 644-656
   ```

2. **Flows are NOT Active**
   - Check flow table: `isActive` must be `true`
   - In UI: Toggle the switch to activate flow

3. **Trigger Type Mismatch**
   - Flow trigger: `comment_received`
   - Webhook event: `dm_received`
   - Solution: Ensure trigger matches the event type

4. **Account Not Active**
   - Check: `instagram_accounts.isActive` = `true`

#### ❌ Issue: "Flows created but executions not showing in activity"

**Debug Checklist:**

```sql
-- 1. Check if webhook events are being received
SELECT * FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check if flows exist and are active
SELECT id, name, account_id, is_active 
FROM flows;

-- 3. Check flow executions
SELECT * FROM flow_executions 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check account mapping
SELECT id, username, instagram_user_id, is_active 
FROM instagram_accounts;
```

#### ❌ Issue: "Webhook events created but not processed"

Check webhook logs in terminal:
```
Webhook received: {...}
Processing webhook for Instagram user ID: 123456789
No account found for Instagram user ID: 123456789
```

**Solution:**
Update the account's `instagramUserId` to match the webhook:

```sql
UPDATE instagram_accounts 
SET instagram_user_id = 'YOUR_ACTUAL_IG_USER_ID'
WHERE username = 'your_username';
```

---

## Diagnostic Steps

### Step 1: Verify Database Connection
```bash
# Make sure you're connected to the correct database
# Check if tables exist:
```

Run this in your database:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- users
- instagram_accounts
- flows
- flow_executions
- webhook_events
- contacts

### Step 2: Check Instagram Account Configuration

```sql
-- Run this query:
SELECT 
  id,
  username,
  instagram_user_id,
  is_active,
  LENGTH(access_token) as token_length
FROM instagram_accounts;
```

**Requirements:**
- ✅ `instagram_user_id` must NOT be null
- ✅ `is_active` must be true
- ✅ `access_token` must exist (length > 50)

### Step 3: Test Flow Manually

1. Go to Flows page
2. Open a flow
3. Click "Test Flow" button
4. Enter test data:
```json
{
  "trigger_type": "comment_received",
  "comment_text": "Hello world",
  "from_username": "testuser",
  "comment_id": "123456789"
}
```

5. Check execution result
6. If it works → Problem is with webhook
7. If it fails → Problem is with flow logic or Instagram API

### Step 4: Check Webhook Logs

Look at server logs when Instagram event happens:
```
[Expected Logs]
Webhook received: { object: 'instagram', entry: [...] }
Processing webhook for Instagram user ID: 123456789
Saving webhook event: comment_received for account: your_username
Saving DM webhook event for account: your_username
Flow execution completed: <execution_id> success
Webhook event marked as processed
```

**If you see:**
- "No account found" → Instagram User ID mismatch
- "No matching flows" → Flow not active or wrong trigger type
- "Flow execution error" → Check error message

### Step 5: Verify Webhook Subscriptions in Meta

1. Meta for Developers → Your App → Webhooks
2. Check Instagram object shows:
   - ✅ Callback URL verified (green checkmark)
   - ✅ Fields subscribed: comments, messages, mentions, story_insights
   - ✅ Instagram account listed under subscriptions

---

## Quick Fixes

### Fix 1: Reset Instagram User ID

If webhook shows different Instagram User ID:

1. Copy the Instagram User ID from webhook logs
2. Update account:
```sql
UPDATE instagram_accounts 
SET instagram_user_id = 'NEW_ID_FROM_WEBHOOK'
WHERE username = 'your_ig_username';
```

### Fix 2: Ensure Flow is Active

```sql
UPDATE flows 
SET is_active = true 
WHERE id = 'YOUR_FLOW_ID';
```

### Fix 3: Clear and Re-subscribe Webhooks

1. Meta Dashboard → Webhooks → Instagram
2. Unsubscribe all fields
3. Re-subscribe to: comments, messages, mentions, story_insights
4. Make sure your Instagram account is selected in subscriptions

### Fix 4: Check Access Token Validity

Test if token works:
```bash
curl -X GET "https://graph.instagram.com/me?fields=id,username&access_token=YOUR_ACCESS_TOKEN"

# Should return:
# { "id": "123456789", "username": "your_username" }

# If error, token is invalid - reconnect Instagram account
```

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "No account found for Instagram user ID" | Instagram User ID mismatch | Update `instagram_user_id` in database |
| "Webhook event left unprocessed" | Flow execution failed | Check Activity page for error details |
| "Unauthorized" | Invalid access token | Reconnect Instagram account |
| "Outside 24-hour messaging window" | Can't send DM >24h after last message | Expected behavior, use Private Reply fallback |
| "Account is inactive" | Account disabled in database | Set `is_active = true` |

---

## Testing Checklist

- [ ] PostgreSQL database is running and accessible
- [ ] Instagram account connected (appears in Accounts page)
- [ ] `instagram_user_id` is not null in database
- [ ] Account is active (`is_active = true`)
- [ ] Access token is valid (test with Graph API)
- [ ] Flow is created and visible in Flows page
- [ ] Flow is **ACTIVE** (toggle switch ON)
- [ ] Flow has correct trigger type (matches webhook event)
- [ ] Webhook callback URL is configured in Meta
- [ ] Webhook verify token matches `.env` value
- [ ] Webhook fields are subscribed (comments, messages, etc.)
- [ ] Instagram account is subscribed in webhook dashboard
- [ ] Test flow manually works
- [ ] Server logs show webhook events arriving
- [ ] Execution records appear in Activity page

---

## Advanced Debugging

### Enable Detailed Logs

Add to your server code temporarily (server/index.ts):

```typescript
// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

### Monitor Real-time Webhook Events

```sql
-- Watch webhook events in real-time
SELECT 
  id,
  event_type,
  processed,
  created_at,
  payload->>'comment_text' as comment_text,
  payload->>'message_text' as message_text
FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 20;
```

### Check Flow-to-Execution Mapping

```sql
SELECT 
  f.id as flow_id,
  f.name as flow_name,
  f.is_active,
  COUNT(e.id) as execution_count,
  MAX(e.created_at) as last_execution
FROM flows f
LEFT JOIN flow_executions e ON f.id = e.flow_id
GROUP BY f.id, f.name, f.is_active;
```

---

## Next Steps

1. **First, fix database connection** (see LOCAL_SETUP.md)
2. **Then, verify Instagram account has correct `instagram_user_id`**
3. **Ensure flows are ACTIVE**
4. **Test flow manually to verify it works**
5. **Check webhook subscription in Meta dashboard**
6. **Monitor logs when posting a test comment/DM on Instagram**

If still having issues, run the diagnostic SQL queries above and share the results.
