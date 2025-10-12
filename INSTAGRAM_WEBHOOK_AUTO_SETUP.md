# Instagram Webhook Auto-Setup Guide

## Two Ways to Enable Webhooks

Instagram webhooks can be configured in **TWO ways**:

### Method 1: Meta App Dashboard (Recommended) ✅
**Best for:** Production apps, one-time setup for all accounts

- Configure once in Meta Dashboard
- Works automatically for ALL Instagram accounts
- No API calls needed per account
- Easiest to set up and maintain

### Method 2: API Per-Account Subscription 🔄
**Best for:** Dynamic apps, programmatic control

- API call when each account connects
- Per-account subscription via `/subscribed_apps` endpoint
- Already automated in this app!
- Requires proper OAuth scopes

**This app uses BOTH methods!** It tries API subscription automatically, but Meta Dashboard setup is still recommended.

## How It Works (Official Instagram API)

According to Instagram's official documentation, webhook subscriptions work via:

```bash
POST https://graph.facebook.com/v24.0/{INSTAGRAM_ACCOUNT_ID}/subscribed_apps
?subscribed_fields=comments,messages,mentions,story_insights
&access_token={USER_ACCESS_TOKEN}
```

**Important:** Use `graph.facebook.com` (not `graph.instagram.com`) for webhook subscriptions.

**Required OAuth Scopes:**
- `instagram_business_basic`
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`

**Response on Success:**
```json
{
  "success": true
}
```

## Current Implementation

Your app automatically attempts webhook subscription when a user connects Instagram:

✅ **OAuth completes** → Account saved to database  
✅ **API subscription fires** (non-blocking, background)  
✅ **Success:** Webhooks active immediately  
✅ **Failure:** Instructions logged for manual setup

## Setup Instructions

### Quick Setup (Method 1 - Recommended)

#### Step 1: Set Webhook Verify Token

1. Generate a secure token (or use existing one):
   - In your app: Navigate to webhook settings
   - Or generate via: `/api/webhook-token/generate`

2. Add to Replit Secrets:
   - Key: `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
   - Value: Your secure random string

#### Step 2: Configure in Meta App Dashboard

1. **Go to Meta for Developers:**
   - URL: https://developers.facebook.com/apps/4224943747791118/webhooks/

2. **Select Instagram:**
   - Click "Instagram" in the object type dropdown

3. **Add Webhook Configuration:**
   - **Callback URL**: `https://insta-flows-nirmal40.replit.app/api/webhooks/instagram`
   - **Verify Token**: (Same as `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`)

4. **Click "Verify and Save"**
   - Meta sends a GET request to verify your endpoint
   - If successful: ✅ "Verified" appears

5. **Subscribe to Webhook Fields:**
   After verification, subscribe to:
   - ✅ `comments` - Comment events on media
   - ✅ `messages` - Direct message events
   - ✅ `mentions` - Mention/tag events in posts/stories
   - ✅ `story_insights` - Story reply events
   - ✅ `live_comments` - Live video comment events
   - ✅ `message_reactions` - Message reaction events

6. **Click "Subscribe"** for each field

### Advanced Setup (Method 2 - Automatic API)

The app automatically calls:

```bash
POST /v24.0/{instagram_account_id}/subscribed_apps
```

**When:** During OAuth callback (non-blocking)  
**Fields:** `comments,messages,mentions,story_insights,live_comments,message_reactions,messaging_postbacks`

**Check Status:**
```bash
GET /api/webhook-status
```

**Manual Trigger:**
```bash
POST /api/webhook-subscribe
{
  "accountId": "your-account-id"
}
```

## Webhook Architecture

### How Webhooks Flow

```
Instagram User Action (DM/Comment/Mention)
         ↓
Instagram Platform detects event
         ↓
Checks: "Is there an app authorized for this account?"
         ↓
YES → Sends webhook to YOUR callback URL
         ↓
Your app receives POST /api/webhooks/instagram
         ↓
Validates signature & verify token
         ↓
Finds matching Instagram account in database
         ↓
Creates webhook event record
         ↓
Triggers matching automation flows
         ↓
Executes actions (reply, DM, etc.)
```

### Webhook Payload Structure

**Verification Request (GET):**
```
GET /api/webhooks/instagram?hub.mode=subscribe&hub.challenge=123456&hub.verify_token=your_token
```

**Event Notification (POST):**
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "instagram_account_id",
      "time": 1234567890,
      "messaging": [
        {
          "sender": { "id": "sender_id" },
          "recipient": { "id": "recipient_id" },
          "timestamp": 1234567890,
          "message": {
            "mid": "message_id",
            "text": "Hello!"
          }
        }
      ]
    }
  ]
}
```

## Webhook Fields & Permissions

| Field | Permissions Required | Events Triggered |
|-------|---------------------|------------------|
| `comments` | `instagram_business_basic`<br>`instagram_business_manage_comments` | New comments on media<br>@mentions in comments |
| `messages` | `instagram_business_basic`<br>`instagram_business_manage_messages` | New direct messages<br>Message reactions |
| `mentions` | Included in `comments` | @mentions in posts/stories |
| `story_insights` | `instagram_business_basic` | Story metrics & replies |
| `live_comments` | `instagram_business_basic`<br>`instagram_business_manage_comments` | Live video comments |
| `message_reactions` | `instagram_business_basic`<br>`instagram_business_manage_messages` | Emoji reactions to messages |

## Testing Webhooks

### Test 1: Direct Message (DM)

1. **Send a DM** to your connected Instagram account
2. **Message:** "Test webhook"

**Expected Results:**
```
Server logs:
✅ Webhook received: {...}
✅ Processing webhook for Instagram user ID: xxxxx
✅ Saving webhook event: dm_received
✅ Flow execution started

Activity page:
✅ New webhook event appears
✅ Flow execution shows "Success"
```

### Test 2: Comment

1. **Comment** on a post from your connected account
2. **Comment:** "Test comment webhook"

**Expected Results:**
- ✅ Webhook event in Activity page
- ✅ Server logs confirm receipt
- ✅ Flow triggers (if configured)

### Test 3: Mention

1. **Create story** or post
2. **Mention:** `@yourconnectedaccount`

**Expected Results:**
- ✅ Mention webhook received
- ✅ Flow execution (if configured)

## Check Webhook Status

### Via API Endpoint

**Browser (while logged in):**
```
https://insta-flows-nirmal40.replit.app/api/webhook-status
```

**Response when configured:**
```json
{
  "configured": true,
  "accountSubscriptions": ["comments", "messages", "mentions"],
  "appSubscriptions": {
    "object": "instagram",
    "callback_url": "https://...",
    "fields": ["comments", "messages", "mentions", "story_insights"]
  }
}
```

### Via Meta Dashboard

1. Go to: https://developers.facebook.com/apps/4224943747791118/webhooks/
2. Select "Instagram" 
3. Look for:
   - ✅ Green checkmark = Verified
   - ✅ "Subscribed" badges = Active

### Via Server Logs

When a webhook arrives, you'll see:
```
Webhook received: {object: "instagram", entry: [...]}
Processing webhook for Instagram user ID: 123456789
Saving webhook event: dm_received
Triggering flows for: dm_received
```

## Troubleshooting

### Issue: No Webhooks Received

**Checklist:**
- [ ] Webhook configured in Meta Dashboard? (green checkmark)
- [ ] `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` set in Replit Secrets?
- [ ] Token matches Meta Dashboard verify token?
- [ ] Instagram account connected via OAuth?
- [ ] App is running? (workflow status: RUNNING)
- [ ] Account is Business/Creator? (Personal accounts don't support webhooks)

**Solution:**
1. Complete Meta Dashboard setup (Method 1)
2. Verify token matches exactly
3. Ensure account is Instagram Business/Creator

### Issue: Webhook Verified but No Events

**Cause:** Fields not subscribed  
**Solution:**
1. Go to Meta Dashboard → Webhooks
2. Ensure "Subscribed" shows for: comments, messages, mentions
3. Click "Subscribe" if not already subscribed

### Issue: API Subscription Fails (403/400 Error)

**Cause:** Missing permissions or incorrect scopes  
**Solution:**
1. Verify OAuth scopes include:
   - `instagram_business_basic`
   - `instagram_business_manage_comments`
   - `instagram_business_manage_messages`
2. Re-authorize Instagram account with correct scopes
3. Use Meta Dashboard setup (Method 1) as fallback

### Issue: Webhooks Work but Flows Don't Trigger

**Checklist:**
- [ ] Flow trigger type matches event? (DM trigger for DM events)
- [ ] Trigger conditions correct?
- [ ] Flow is enabled/active?
- [ ] Flow assigned to correct Instagram account?

**Debug:**
1. Check Activity page for webhook events
2. Verify event type matches flow trigger
3. Check flow execution logs for errors

## Security & Validation

### Signature Validation

Instagram signs all webhook payloads with SHA256:

```javascript
// Webhook handler validates signature
const signature = req.headers['x-hub-signature-256'];
const expectedSignature = crypto
  .createHmac('sha256', APP_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature === `sha256=${expectedSignature}`) {
  // Valid webhook from Instagram
}
```

### Best Practices

1. ✅ **Use HTTPS** - Required by Instagram
2. ✅ **Validate signatures** - Verify all payloads
3. ✅ **Strong verify token** - Min 32 random characters
4. ✅ **Handle duplicates** - Instagram may retry failed webhooks
5. ✅ **Respond quickly** - Return 200 OK within 20 seconds
6. ✅ **Process async** - Handle heavy operations in background

## Production Checklist

Before going live:

- [ ] `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` set in Replit Secrets
- [ ] `INSTAGRAM_APP_ID` configured
- [ ] `INSTAGRAM_APP_SECRET` configured
- [ ] `OAUTH_BASE_URL` set to production domain
- [ ] Webhooks configured in Meta Dashboard
- [ ] All required fields subscribed (comments, messages, mentions, story_insights)
- [ ] Webhook URL verified successfully (green checkmark)
- [ ] Test DM triggers webhook ✓
- [ ] Test comment triggers webhook ✓
- [ ] Activity page shows webhook events ✓
- [ ] Flow executions complete successfully ✓
- [ ] App set to "Live" mode in Meta Dashboard

## Comparison: Dashboard vs API Setup

| Aspect | Meta Dashboard (Method 1) | API Subscription (Method 2) |
|--------|--------------------------|----------------------------|
| **Setup** | One-time manual | Automatic per account |
| **Scope** | All accounts | Per account |
| **Permissions** | App-level | Requires OAuth scopes |
| **Maintenance** | Set and forget | Handled by app |
| **Reliability** | Very high | Depends on API |
| **Best For** | Production apps | Dynamic/multi-tenant apps |

## Next Steps

1. ✅ **Set verify token** in Replit Secrets
2. ✅ **Configure Meta Dashboard** (Method 1 - Recommended)
3. ✅ **Connect Instagram accounts** via OAuth
4. ✅ **Send test DM** to verify webhooks
5. ✅ **Check Activity page** for webhook events
6. ✅ **Create automation flows** to respond

Your Instagram automation platform now has **professional-grade webhook integration** using official Instagram API methods! 🚀

## Resources

- **Instagram Webhooks Docs**: https://developers.facebook.com/docs/instagram-platform/webhooks
- **Meta App Dashboard**: https://developers.facebook.com/apps/4224943747791118
- **Webhook Subscriptions Guide**: See attached documentation
- **Testing Guide**: `WEBHOOK_TESTING_GUIDE.md`
- **OAuth Setup**: `INSTAGRAM_OAUTH_SETUP.md`
