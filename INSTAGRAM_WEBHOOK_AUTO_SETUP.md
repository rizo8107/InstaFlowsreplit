# Instagram Webhook Auto-Setup Guide

## How ManyChat-Style Webhooks Work

When you connect an Instagram account to ManyChat (or any automation platform), webhooks start working **automatically**. Here's how:

### The Secret: App-Level Webhook Subscriptions

Unlike what many think, Instagram webhooks are configured at the **APP level**, not per-account:

1. **One-Time Setup**: Configure webhooks in Meta App Dashboard (just once)
2. **Automatic Activation**: When ANY user connects their Instagram account via OAuth, Instagram automatically starts sending webhooks for that account
3. **No Per-Account Setup**: You don't need to subscribe webhooks for each account individually

This is exactly how ManyChat, MobileMonkey, and other automation platforms work!

## Current Implementation

Your app now has **automatic webhook subscription** built-in:

✅ **When a user connects Instagram:**
- OAuth authentication completes
- Account is saved to database
- **NEW**: System automatically attempts to subscribe to webhooks
- If successful: Webhooks are active immediately
- If manual setup needed: Instructions are displayed in server logs

## Setup Instructions

### Step 1: Set Up Webhook Verify Token

```bash
# Generate a secure token (already handled in your app)
# Or use this one: your-secure-webhook-token-123
```

Add to Replit Secrets:
- Key: `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
- Value: A secure random string (generate via `/api/webhook-token/generate`)

### Step 2: Configure Webhooks in Meta App Dashboard

1. **Go to Meta for Developers:**
   - URL: https://developers.facebook.com/apps/4224943747791118/webhooks/

2. **Select Instagram:**
   - Click "Instagram" in the object type dropdown

3. **Add Webhook Configuration:**
   - **Callback URL**: `https://insta-flows-nirmal40.replit.app/api/webhooks/instagram`
   - **Verify Token**: (Same as INSTAGRAM_WEBHOOK_VERIFY_TOKEN)

4. **Click "Verify and Save"**
   - Meta will send a GET request to verify your endpoint
   - If successful, you'll see "✓ Verified"

5. **Subscribe to Fields:**
   After verification, subscribe to these webhook fields:
   - ✅ `comments` - Comment events
   - ✅ `messages` - Direct message events
   - ✅ `mentions` - Mention/tag events
   - ✅ `story_insights` - Story reply events

6. **Click "Subscribe"** for each field

### Step 3: Test Webhook Delivery

Once configured:

1. **Connect an Instagram account** via OAuth (if not already connected)
2. **Send a DM** to that Instagram account
3. **Check server logs** - You should see:
   ```
   Webhook received: {...}
   Processing webhook for Instagram user ID: xxxxx
   ```
4. **Check Activity page** - The webhook event should appear

## How It Works

### Architecture

```
Instagram User Action (DM/Comment)
         ↓
Instagram Platform detects event
         ↓
Checks: "Is there an app authorized for this account?"
         ↓
YES → Sends webhook to YOUR app
         ↓
Your app receives POST /api/webhooks/instagram
         ↓
Finds matching Instagram account in database
         ↓
Creates webhook event record
         ↓
Triggers matching flows
         ↓
Executes automation actions
```

### Key Points

1. **App-Level Configuration**: Webhooks are configured once for the entire app
2. **Automatic Routing**: Instagram automatically sends webhooks for ALL authorized accounts
3. **No Per-Account Setup**: Just connect via OAuth, webhooks work immediately
4. **Secure Verification**: Uses verify token to ensure webhooks are from Instagram

## Automatic Subscription (New Feature)

Your app now automatically attempts to subscribe to webhooks when:

1. A user connects their Instagram account via OAuth
2. The OAuth callback completes successfully
3. System calls Instagram Graph API to check/create webhook subscription
4. If successful: ✅ Webhooks active immediately
5. If fails: ⚠️ Manual setup instructions logged

### Check Webhook Status

```bash
GET /api/webhook-status
```

Returns:
```json
{
  "configured": true/false,
  "subscriptions": [...],
  "callbackUrl": "https://...",
  "setupInstructions": "..."
}
```

### Manually Trigger Subscription

```bash
POST /api/webhook-subscribe
{
  "accountId": "your-account-id"
}
```

## Common Issues

### Issue 1: "Webhook not receiving events"

**Cause**: Webhook not configured in Meta Dashboard
**Solution**: Follow Step 2 above to configure webhooks

### Issue 2: "403 Forbidden on webhook verification"

**Cause**: Verify token mismatch
**Solution**: 
1. Check `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` in Replit Secrets
2. Ensure it matches the token in Meta App Dashboard

### Issue 3: "Webhook receives events but flow doesn't trigger"

**Cause**: Flow trigger doesn't match event type
**Solution**:
1. Check flow trigger type (DM, Comment, etc.)
2. Verify trigger conditions match incoming event data

### Issue 4: "Cannot verify webhook URL"

**Cause**: App not running or URL incorrect
**Solution**:
1. Ensure your app is deployed and running
2. Verify callback URL is correct: `https://insta-flows-nirmal40.replit.app/api/webhooks/instagram`
3. Check server logs for verification request

## Testing Webhooks

### Manual Test

1. **DM Test:**
   - Send a DM to your connected Instagram account
   - Check server logs for webhook receipt
   - Verify flow execution in Activity page

2. **Comment Test:**
   - Comment on a post from connected account
   - Check webhook delivery
   - Verify flow trigger

3. **Mention Test:**
   - Mention the account in a post/comment
   - Check webhook receipt
   - Verify automation execution

### Debug Mode

Enable detailed logging:
```bash
# Server logs show:
- Webhook received: {...}
- Processing webhook for Instagram user ID: xxxxx
- Saving webhook event: dm_received
- Triggering flows for: dm_received
- Flow execution started: {...}
```

## Security Best Practices

1. **Verify Token**: Use a strong, random token (min 32 characters)
2. **HTTPS Only**: Always use HTTPS for webhook URLs
3. **Validate Payload**: App verifies Instagram signature (built-in)
4. **Rate Limiting**: Consider adding rate limits for webhook endpoint

## Production Checklist

Before going live:

- [ ] INSTAGRAM_WEBHOOK_VERIFY_TOKEN is set in Replit Secrets
- [ ] Webhooks configured in Meta App Dashboard
- [ ] All required fields subscribed (comments, messages, mentions, story_insights)
- [ ] Webhook URL verified successfully
- [ ] Test DM/comment triggers flow correctly
- [ ] Activity page shows webhook events
- [ ] Flow executions complete successfully

## Comparison: Manual vs Auto Setup

### Manual Setup (Old Way)
1. User connects Instagram
2. Admin goes to Meta Dashboard
3. Admin configures webhooks manually
4. Admin subscribes to fields
5. Webhooks start working

### Auto Setup (New Way - Like ManyChat)
1. User connects Instagram
2. ✅ Webhooks configured automatically (or instructions shown)
3. ✅ System subscribes to required fields
4. ✅ Webhooks work immediately

## Next Steps

1. Follow Step 2 to configure webhooks in Meta Dashboard (one-time setup)
2. Connect Instagram accounts via OAuth
3. Webhooks will automatically work for all connected accounts!
4. Monitor Activity page for webhook events
5. Create flows to automate responses

Your Instagram automation platform now works exactly like ManyChat! 🎉
