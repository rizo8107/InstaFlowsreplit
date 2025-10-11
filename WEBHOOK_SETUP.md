# Instagram Webhook Setup Guide

## Overview
Your Instagram automation platform uses webhooks to receive real-time events from Instagram and automatically trigger your flows.

## Webhook Endpoint
Your webhook is already implemented and running at:
```
POST /api/webhooks/instagram
GET  /api/webhooks/instagram (for verification)
```

## Setup Steps

### 1. Deploy Your Application (Required First!)
Before you can configure webhooks, you need to deploy your app so Instagram can reach it:

1. Click the **"Publish"** button in Replit to deploy your application
2. Note your published URL (e.g., `https://your-app-name.replit.app`)
3. Your webhook URL will be: `https://your-app-name.replit.app/api/webhooks/instagram`

### 2. Configure in Meta for Developers

1. Go to [Meta for Developers](https://developers.facebook.com/apps)
2. Select your Instagram app
3. Navigate to **Products** → **Webhooks**
4. Click **Configure** next to Instagram
5. Click **Add Callback URL**

Enter:
- **Callback URL**: `https://your-app-name.replit.app/api/webhooks/instagram`
- **Verify Token**: Use the value from your `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` secret

6. Click **Verify and Save**

### 3. Subscribe to Webhook Fields

After verification, subscribe to these fields:
- ✅ **comments** - Receives comment events
- ✅ **messages** - Receives DM events  
- ✅ **mentions** - Receives mention events
- ✅ **story_insights** - Receives story reply events

Click **Subscribe** for each field you want to monitor.

### 4. Test Your Webhook

After setup, test it:

1. Create and activate a flow in your app
2. Perform the trigger action on Instagram (e.g., post a comment)
3. Check the **Activity** page to see if the flow executed

## How It Works

### Event Flow:
1. User interacts with your Instagram (comment, DM, mention, etc.)
2. Instagram sends webhook event → Your `/api/webhooks/instagram` endpoint
3. System finds active flows matching the event type and account
4. Flow engine executes the flow:
   - Evaluates condition nodes
   - Executes action nodes (reply, like, hide, etc.)
   - Calls Instagram Graph API to perform actions
5. Execution logged in Activity page

### Supported Events:
- **comment_received** - New comment on your posts
- **dm_received** - New direct message
- **mention_received** - Mentioned in a post/story
- **story_reply_received** - Reply to your story

### Security:
- Webhook verification using `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
- Only processes events for active accounts
- Only executes active flows
- All executions are logged with success/failure status

## Troubleshooting

### Webhook not receiving events?
1. Check your app is deployed and accessible publicly
2. Verify the callback URL matches exactly (including `https://`)
3. Ensure verify token matches your environment secret
4. Check webhook subscriptions are active in Meta dashboard
5. Verify Instagram account is connected and active

### Flows not executing?
1. Ensure flow is **Active** (toggle on in Flows page)
2. Check trigger type matches the event (e.g., comment flow for comments)
3. Verify account is active and has valid access token
4. Check Activity page for execution errors

### Actions not working?
1. Verify Instagram access token has required permissions
2. Check Instagram API rate limits
3. Review execution error messages in Activity page

## Environment Variables

Required secrets for webhooks:
- `INSTAGRAM_APP_ID` - Your Facebook App ID
- `INSTAGRAM_APP_SECRET` - Your App Secret  
- `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` - Custom token for verification (set this yourself)

## Testing Webhooks Locally

For local development, use a tool like ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose port 5000
ngrok http 5000

# Use the ngrok URL as your callback URL
# Example: https://abc123.ngrok.io/api/webhooks/instagram
```

Note: Remember to update the callback URL in Meta dashboard when switching between local/deployed.
