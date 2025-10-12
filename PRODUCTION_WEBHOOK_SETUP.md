# Production Webhook Setup Guide

## ✅ Critical Fixes Applied

### Fixed Issues:
1. **🔧 Corrected API Endpoint**: Changed from `graph.facebook.com` to `graph.instagram.com` for webhook subscriptions (per Instagram official docs)
2. **🔐 Database-First Token**: Webhook verify token stored in database with environment fallback
3. **🚀 Auto-Subscription**: Webhook subscription now works automatically when Instagram accounts connect
4. **📊 Enhanced Logging**: Added detailed logging to debug webhook verification and subscription

### Changes Made:
1. **Correct API Base URL**: Now uses `graph.instagram.com/v24.0/{instagram-account-id}/subscribed_apps` for subscriptions
2. **Database-First Approach**: Webhook verify token stored in database with auto-sync from Replit Secrets
3. **Production Ready**: Both development and production share the same database and token
4. **Debug Logging**: Console logs show exactly what token is being used and why verification passes/fails

## 🚀 How to Set Up Webhooks in Production

### Step 1: Access Production Site
1. Go to your production URL: `https://insta-flows-nirmal40.replit.app`
2. **Register/Login** first (you'll get 401 errors if not logged in)

### Step 2: Configure Webhook Token

**Option A - Use Existing Token (Recommended):**
1. Login to production site
2. Go to **Accounts** page
3. The webhook token should already be there (auto-synced from environment)
4. Copy the token shown in the field

**Option B - Generate New Token:**
1. Login to production site
2. Go to **Accounts** page
3. Click **"Generate"** button to create a new token
4. Click **"Save"** to store it in database
5. Copy the generated token

### Step 3: Configure Meta Developer Dashboard
1. Go to: https://developers.facebook.com/apps/YOUR_APP_ID/webhooks/
2. Select **"Instagram"** as the object type
3. Enter webhook details:
   - **Callback URL**: `https://insta-flows-nirmal40.replit.app/api/webhooks/instagram`
   - **Verify Token**: *Paste the token from Step 2*
4. Subscribe to fields:
   - ✓ comments
   - ✓ messages
   - ✓ mentions
   - ✓ story_insights
   - ✓ live_comments
   - ✓ message_reactions
5. Click **"Verify and save"**

## ✅ How It Works

### Development Environment:
- Uses Replit Secrets: `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
- Auto-syncs to database on first access
- Webhooks verify using database value

### Production Environment:
- Shares same database as development
- Auto-syncs token from Replit Secrets on first access
- No manual configuration needed!

### Token Priority:
1. **Database** (checked first)
2. **Environment Variable** (fallback)
3. Auto-saves env var to database if database is empty

## 🔍 Troubleshooting

### "401 Unauthorized" Error
**Cause**: Not logged into production site  
**Solution**: Go to production URL and register/login first

### "Token couldn't be validated" in Meta Dashboard
**Cause**: Token mismatch between your app and Meta  
**Solution**: 
1. Login to production
2. Copy exact token from Accounts page
3. Paste into Meta Dashboard
4. Click "Verify and save"

### Webhook Not Receiving Events
**Cause**: Account not connected or webhook not subscribed  
**Solution**:
1. Connect Instagram account via OAuth
2. Check webhook status in Accounts page
3. Verify subscription fields in Meta Dashboard

## 📝 Key Points

- **Production and development share the same database**
- **Tokens auto-sync from environment variables**
- **Must login to production before accessing any pages**
- **Token in database must match token in Meta Dashboard exactly**

## 🎯 Quick Setup Checklist

- [ ] Login to production site
- [ ] Copy webhook token from Accounts page
- [ ] Configure Meta Dashboard with callback URL and token
- [ ] Subscribe to webhook fields
- [ ] Click "Verify and save" in Meta
- [ ] Test by sending a DM to your Instagram account
