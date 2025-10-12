# Webhook Testing Guide

## How to Check Webhook Connection Status

### Method 1: Check in Your App (Easiest)

1. **Go to Accounts page** in your app
2. The app will automatically show webhook status
3. Look for webhook status indicator

### Method 2: Use API Endpoint

**Check Status:**
```bash
GET https://insta-flows-nirmal40.replit.app/api/webhook-status
```

**Response if configured:**
```json
{
  "configured": true,
  "subscriptions": ["comments", "messages", "mentions"],
  "callbackUrl": "https://..."
}
```

**Response if NOT configured:**
```json
{
  "configured": false,
  "message": "Manual webhook setup required",
  "setupInstructions": "..."
}
```

### Method 3: Check Meta App Dashboard

1. Go to: https://developers.facebook.com/apps/4224943747791118/webhooks/
2. Select **"Instagram"** from dropdown
3. Look for:
   - ✅ Green checkmark = Webhook verified
   - ✅ "Subscribed" badges on fields
   - ❌ No webhook configured

## How to Test Webhooks

### Test 1: Send a Direct Message (DM)

**Steps:**
1. Open Instagram app on your phone
2. Send a DM to your connected Instagram account
3. Message content: "Test webhook"

**What to Check:**
- ✅ Server logs should show: `Webhook received: {...}`
- ✅ Activity page should show new webhook event
- ✅ If you have a flow for DMs, it should trigger

### Test 2: Comment on a Post

**Steps:**
1. Go to a post from your connected account
2. Add a comment: "Test comment webhook"

**What to Check:**
- ✅ Server logs show: `Processing webhook for Instagram user ID: xxxxx`
- ✅ Activity page shows comment event
- ✅ Flow triggers if configured

### Test 3: Mention in Story/Post

**Steps:**
1. Create a story or post
2. Mention your connected Instagram account: `@youraccount`

**What to Check:**
- ✅ Webhook event appears in Activity page
- ✅ Server logs confirm receipt

## Checking Test Results

### 1. Check Server Logs

**Where:** Server console (Replit)

**What to look for:**
```
✅ SUCCESS:
Webhook received: {object: "instagram", entry: [...]}
Processing webhook for Instagram user ID: 123456789
Saving webhook event: dm_received
Flow execution started: {...}

❌ FAILURE:
(No logs appear after sending DM/comment)
```

### 2. Check Activity Page

**Where:** Your app → Activity page

**What to see:**
- Recent webhook events listed
- Event type (DM, Comment, Mention)
- Timestamp
- Flow executions (if triggered)

### 3. Check Flow Execution

**Where:** Activity page → Flow Executions

**What to see:**
- Flow name
- Status (Success/Failed)
- Execution details
- Actions performed

## Troubleshooting Webhook Issues

### Issue: No Webhooks Received

**Check:**
1. ✅ Is webhook configured in Meta Dashboard?
   - Go to: https://developers.facebook.com/apps/4224943747791118/webhooks/
   - Should see green checkmark

2. ✅ Is INSTAGRAM_WEBHOOK_VERIFY_TOKEN set?
   - Check Replit Secrets
   - Must match token in Meta Dashboard

3. ✅ Is Instagram account connected via OAuth?
   - Check Accounts page
   - Should show account username

4. ✅ Is app running?
   - Check workflow status
   - Should be "RUNNING"

### Issue: Webhook Verified but No Events

**Check:**
1. ✅ Are webhook fields subscribed?
   - Go to Meta Dashboard → Webhooks
   - Should show "Subscribed" for: comments, messages, mentions

2. ✅ Is Instagram account a Business/Creator account?
   - Webhooks only work with Business/Creator accounts
   - Check account type in Instagram settings

3. ✅ Is app approved for webhooks?
   - Some webhooks require App Review
   - Check App Review status in Meta Dashboard

### Issue: Webhooks Work but Flows Don't Trigger

**Check:**
1. ✅ Does flow trigger match event type?
   - DM event → Flow should have "Direct Message" trigger
   - Comment event → Flow should have "Comment" trigger

2. ✅ Are trigger conditions correct?
   - Check condition logic
   - Test with simple condition first

3. ✅ Is flow enabled?
   - Check flow status
   - Should be "Active"

## Quick Test Checklist

Use this checklist to verify webhooks are working:

- [ ] Webhook configured in Meta Dashboard (green checkmark)
- [ ] INSTAGRAM_WEBHOOK_VERIFY_TOKEN set in Replit Secrets
- [ ] Instagram account connected via OAuth
- [ ] App is running (workflow status: RUNNING)
- [ ] Send test DM to Instagram account
- [ ] Check server logs for "Webhook received"
- [ ] Check Activity page for webhook event
- [ ] Verify flow triggered (if configured)

## Expected Timeline

**After sending test message:**
- ⏱️ 1-5 seconds: Webhook arrives at your server
- ⏱️ <1 second: Webhook event saved to database
- ⏱️ <1 second: Flow execution starts
- ⏱️ 1-3 seconds: Actions complete

**If nothing happens after 30 seconds:**
- Webhook is NOT configured correctly
- Follow troubleshooting steps above

## Success Indicators

✅ **Webhooks Working:**
- Server logs show incoming webhooks
- Activity page shows events
- Flows execute automatically
- Actions complete successfully

❌ **Webhooks NOT Working:**
- No server logs
- Activity page empty
- Flows don't trigger
- Manual testing shows no response

## Next Steps

1. ✅ Complete webhook setup in Meta Dashboard
2. ✅ Send test DM to your Instagram account
3. ✅ Check server logs and Activity page
4. ✅ Create a simple test flow
5. ✅ Verify automation works end-to-end

Once webhooks are working, you're ready to build automations! 🚀
